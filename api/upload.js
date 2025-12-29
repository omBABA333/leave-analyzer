import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";
import dbConnect from "./db";           
import Attendance from "./models/Attendance"; 

// 1. ROBUST DATE PARSER (Fixes the "45662" -> Sunday bug)
const parseExcelDate = (val) => {
  if (!val) return null;

  // Check if value is a serial number (like 45662)
  const asNumber = parseFloat(val);
  
  // Excel serials are valid if they are roughly between 20000 and 60000
  if (!isNaN(asNumber) && asNumber > 20000 && asNumber < 60000 && String(val).match(/^\d+(\.\d+)?$/)) {
    // Convert Excel Serial to JS Date (UTC aligned)
    return new Date(Math.round((asNumber - 25569) * 86400 * 1000));
  }

  // Otherwise, try standard string parsing
  const date = new Date(val);
  if (!isNaN(date.getTime())) return date;
  
  return null;
};

// 2. HELPER: Display Date nicely (YYYY-MM-DD)
const formatDateString = (dateObj) => {
  if (!dateObj) return "-";
  return dateObj.toISOString().split('T')[0];
};

// 3. HELPER: Display Time (HH:MM)
const formatTimeDisplay = (val) => {
  if (val === undefined || val === null || val === "") return "-";
  if (typeof val === 'number') {
    const totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    // Handle wrap-around for display (e.g. 25:00 -> 01:00)
    const hStr = String(hours % 24).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr}`;
  }
  return String(val);
};

// 4. HELPER: Parse Time for Calculation (Decimal Hours)
const parseTime = (val) => { 
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === 'number') return val * 24; 
  const str = String(val).trim().toUpperCase();
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    if (str.includes("PM") && h < 12) h += 12;
    if (str.includes("AM") && h === 12) h = 0;
    return h + (m / 60);
  }
  return null;
};

// 5. HELPER: Fuzzy Match Keys
const getValue = (row, ...candidates) => { 
  const keys = Object.keys(row);
  for (let cand of candidates) {
    const norm = cand.toLowerCase().replace(/[- ]/g, '');
    const key = keys.find(k => k.toLowerCase().replace(/[- ]/g, '') === norm);
    if (key) return row[key];
  }
  return null;
};

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try { await dbConnect(); } catch (error) { return res.status(500).json({ error: "DB Connection Failed" }); }

  const form = new IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload parsing failed" });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const workbook = XLSX.readFile(file.filepath);
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      let totalExpected = 0, totalWorked = 0, leaves = 0, workingDays = 0;
      let employeeName = "Unknown";
      const datesToOverwrite = [];

      const processedData = data.map((row) => {
        const nameInRow = getValue(row, 'Employee Name', 'EmployeeName', 'Name');
        if (nameInRow) employeeName = nameInRow;

        const dateRaw = getValue(row, 'Date', 'date');
        const inTimeRaw = getValue(row, 'In-Time', 'InTime');
        const outTimeRaw = getValue(row, 'Out-Time', 'OutTime');
        
        // --- STEP 1: Parse Date Correctly ---
        const dateObj = parseExcelDate(dateRaw);
        
        if (!dateObj) {
           // Skip bad rows or handle error
           return { employeeName, date: "Invalid Date", status: "Error", isLeave: false };
        }

        const formattedDate = formatDateString(dateObj);
        datesToOverwrite.push(formattedDate); 

        // --- STEP 2: Identify Day of Week (0 = Sunday) ---
        const day = dateObj.getUTCDay(); 

        let expected = 0;
        let dayType = 'Weekday';
        
        // --- STEP 3: Apply Strict Logic ---
        if (day === 0) { 
          dayType = 'Sunday'; 
          expected = 0; // Sunday = 0 Expected Hours
        } else if (day === 6) { 
          dayType = 'Saturday'; 
          expected = 4.0; 
          workingDays++; 
        } else { 
          expected = 8.5; 
          workingDays++; 
        }

        const inTimeDisplay = formatTimeDisplay(inTimeRaw);
        const outTimeDisplay = formatTimeDisplay(outTimeRaw);
        const inTimeVal = parseTime(inTimeRaw);
        const outTimeVal = parseTime(outTimeRaw);

        let worked = 0;
        let isLeave = false;
        let status = 'Present';

        if (inTimeVal != null && outTimeVal != null) {
          worked = outTimeVal - inTimeVal;
          if (worked < 0) worked += 24; // Handle overnight shifts
        } else if (expected > 0) {
          // It's a workday (Mon-Sat) AND no time logged -> ABSENT
          isLeave = true; 
          leaves++; 
          status = 'Absent / Leave';
        } else if (day === 0) {
          // It's Sunday AND no time logged -> WEEKEND (Not Absent)
          status = 'Weekend';
        }

        totalExpected += expected;
        totalWorked += worked;

        return {
          employeeName, 
          date: formattedDate,
          dayType,
          inTime: inTimeDisplay,
          outTime: outTimeDisplay,
          workedHours: parseFloat(worked.toFixed(2)),
          expectedHours: expected,
          isLeave,
          status
        };
      });

      // --- STEP 4: Prevent Duplicates (Delete old entries for these dates) ---
      if (employeeName !== "Unknown" && datesToOverwrite.length > 0) {
        await Attendance.deleteMany({ 
          employeeName: employeeName, 
          date: { $in: datesToOverwrite } 
        });
      }

      await Attendance.insertMany(processedData);

      const productivity = totalExpected > 0 
        ? ((totalWorked / totalExpected) * 100).toFixed(2) 
        : "0.00";

      return res.status(200).json({
        message: "Analysis Complete",
        summary: {
          employeeName,
          workingDays,
          totalExpected,
          totalWorked: totalWorked.toFixed(2),
          leaves,
          productivity
        },
        details: processedData
      });

    } catch (e) {
      console.error("Processing Error:", e);
      return res.status(500).json({ error: "Processing failed: " + e.message });
    }
  });
}