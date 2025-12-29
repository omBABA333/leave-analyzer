import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";
import dbConnect from "./db";           
import Attendance from "./models/Attendance"; 

// ... [Keep your parseTime and getValue helper functions exactly as they are] ...
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
  // 1. Enable CORS just in case (optional but helpful)
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 2. DEBUG MODE: Try to connect and catch specifically
  try {
    await dbConnect();
  } catch (error) {
    console.error("DB_CONNECT_FAIL:", error.message);
    // Send the EXACT error to the frontend so you can see it
    return res.status(500).json({ 
      error: `Database Error: ${error.message}. Check Vercel Env Vars and MongoDB IP Whitelist.` 
    });
  }

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

      const processedData = data.map((row) => {
        const nameInRow = getValue(row, 'Employee Name', 'EmployeeName', 'Name');
        if (nameInRow) employeeName = nameInRow;

        const dateRaw = getValue(row, 'Date', 'date');
        const inTimeRaw = getValue(row, 'In-Time', 'InTime');
        const outTimeRaw = getValue(row, 'Out-Time', 'OutTime');
        
        const dateObj = new Date(dateRaw);
        const day = dateObj.getDay();
        let expected = 0;
        let dayType = 'Weekday';
        
        if (day === 0) { dayType = 'Sunday'; }
        else if (day === 6) { expected = 4.0; dayType = 'Saturday'; workingDays++; }
        else { expected = 8.5; workingDays++; }

        const inTime = parseTime(inTimeRaw);
        const outTime = parseTime(outTimeRaw);
        let worked = 0;
        let isLeave = false;
        let status = 'Present';

        if (inTime != null && outTime != null) {
          worked = outTime - inTime;
          if (worked < 0) worked = 0;
        } else if (expected > 0) {
          isLeave = true; leaves++; status = 'Absent / Leave';
        } else if (day === 0) { status = 'Weekend'; }

        totalExpected += expected;
        totalWorked += worked;

        return {
          employeeName, 
          date: dateRaw,
          dayType,
          inTime: inTimeRaw || '-',
          outTime: outTimeRaw || '-',
          workedHours: parseFloat(worked.toFixed(2)),
          expectedHours: expected,
          isLeave,
          status
        };
      });

      // 3. Save to DB with Error Handling
      try {
        await Attendance.insertMany(processedData);
      } catch (dbError) {
        console.error("INSERT_ERROR:", dbError);
        return res.status(500).json({ error: "Failed to save to Database: " + dbError.message });
      }

      const productivity = totalExpected > 0 
        ? ((totalWorked / totalExpected) * 100).toFixed(2) 
        : "0.00";

      return res.status(200).json({
        message: "Data Analyzed & Saved to DB",
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