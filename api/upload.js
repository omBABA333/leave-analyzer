import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";
import dbConnect from "./db";           
import Attendance from "./models/Attendance"; 

// 1. ROBUST DATE PARSER
const parseExcelDate = (val) => {
  if (!val) return null;
  const asNumber = parseFloat(val);
  // Excel serial number check (20000 - 60000 covers years 1954 - 2064)
  if (!isNaN(asNumber) && asNumber > 20000 && asNumber < 60000 && String(val).match(/^\d+(\.\d+)?$/)) {
    return new Date(Math.round((asNumber - 25569) * 86400 * 1000));
  }
  const date = new Date(val);
  if (!isNaN(date.getTime())) return date;
  return null;
};

// 2. HELPER: Display Date nicely
const formatDateString = (dateObj) => {
  if (!dateObj) return "-";
  return dateObj.toISOString().split('T')[0];
};

// 3. HELPER: Display Time
const formatTimeDisplay = (val) => {
  if (val === undefined || val === null || val === "") return "-";
  if (typeof val === 'number') {
    const totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hStr = String(hours % 24).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr}`;
  }
  return String(val);
};

// 4. HELPER: Parse Time for Calculation
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
        
        const dateObj = parseExcelDate(dateRaw);
        
        if (!dateObj) {
           return { employeeName, date: "Invalid Date", status: "Error", isLeave: false };
        }

        const formattedDate = formatDateString(dateObj);
        datesToOverwrite.push(formattedDate); 

        const day = dateObj.getUTCDay(); // 0=Sunday
        
        let expected = 0;
        let dayType = 'Weekday';
        let status = 'Present'; // Default
        let isLeave = false;
        let worked = 0;

        // --- STRICT SUNDAY LOGIC ---
        if (day === 0) {
          // Force EVERYTHING to zero for Sunday
          dayType = 'Sunday';
          expected = 0;
          worked = 0;
          status = 'Weekend';
          // We ignore InTime/OutTime completely
        } 
        else {
          // --- MONDAY TO SATURDAY LOGIC ---
          if (day === 6) { 
            dayType = 'Saturday'; 
            expected = 4.0; 
            workingDays++; 
          } else { 
            expected = 8.5; 
            workingDays++; 
          }

          // Calculate Worked Hours
          const inTimeVal = parseTime(inTimeRaw);
          const outTimeVal = parseTime(outTimeRaw);

          if (inTimeVal != null && outTimeVal != null) {
            worked = outTimeVal - inTimeVal;
            if (worked < 0) worked += 24; // Handle overnight
            status = 'Present';
          } else {
            // No time logged on a working day = ABSENT
            isLeave = true;
            leaves++;
            status = 'Absent / Leave';
          }
        }

        const inTimeDisplay = formatTimeDisplay(inTimeRaw);
        const outTimeDisplay = formatTimeDisplay(outTimeRaw);

        totalExpected += expected;
        totalWorked += worked;

        return {
          employeeName, 
          date: formattedDate,
          dayType,
          inTime: day === 0 ? '-' : inTimeDisplay, // Hide time on Sunday
          outTime: day === 0 ? '-' : outTimeDisplay, // Hide time on Sunday
          workedHours: parseFloat(worked.toFixed(2)),
          expectedHours: expected,
          isLeave,
          status
        };
      });

      // Clear Duplicates
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