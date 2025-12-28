import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";

// 1. Time Parser
const parseTime = (val) => {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === 'number') return val * 24; // Excel fraction
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

// 2. Column Finder (Fuzzy Match)
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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = new IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload failed" });
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ error: "No file" });

    try {
      const workbook = XLSX.readFile(file.filepath);
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      let totalExpected = 0, totalWorked = 0, leaves = 0, workingDays = 0;
      let employeeName = "Unknown"; // Default

      const details = data.map((row) => {
        // Capture Employee Name (if exists in row)
        const nameInRow = getValue(row, 'Employee Name', 'EmployeeName', 'Name', 'Employee');
        if (nameInRow) employeeName = nameInRow;

        const dateRaw = getValue(row, 'Date', 'date');
        const inTimeRaw = getValue(row, 'In-Time', 'InTime');
        const outTimeRaw = getValue(row, 'Out-Time', 'OutTime');

        // Date & Day Logic
        const dateObj = new Date(dateRaw);
        const day = dateObj.getDay(); // 0=Sun, 6=Sat
        
        let expected = 0;
        let dayType = 'Weekday';

        if (day === 0) {
          dayType = 'Sunday';
        } else if (day === 6) {
          expected = 4.0;
          dayType = 'Saturday';
          workingDays++;
        } else {
          expected = 8.5;
          workingDays++;
        }

        // Time Calculation
        const inTime = parseTime(inTimeRaw);
        const outTime = parseTime(outTimeRaw);
        let worked = 0;
        let isLeave = false;
        let status = 'Present';

        if (inTime != null && outTime != null) {
          worked = outTime - inTime;
          if (worked < 0) worked = 0;
        } else if (expected > 0) {
          isLeave = true;
          leaves++;
          status = 'Absent / Leave';
        } else if (day === 0) {
           status = 'Weekend';
        }

        totalExpected += expected;
        totalWorked += worked;

        return {
          Date: dateRaw,
          Employee: employeeName,
          DayType: dayType,
          InTime: inTimeRaw || '-',
          OutTime: outTimeRaw || '-',
          workedHours: worked.toFixed(2),
          status,
          isLeave
        };
      });

      const productivity = totalExpected > 0 
        ? ((totalWorked / totalExpected) * 100).toFixed(2) 
        : "0.00";

      return res.status(200).json({
        message: "Success",
        summary: {
          employeeName, // Send back the name found
          workingDays,
          totalExpected,
          totalWorked: totalWorked.toFixed(2),
          leaves,
          productivity
        },
        details
      });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Processing failed" });
    }
  });
}