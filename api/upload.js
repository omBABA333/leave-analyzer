import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";

// 1. SMART TIME PARSER (Handles "10:00", "10:00 AM", and Excel Decimals)
const parseTime = (val) => {
  if (val === undefined || val === null || val === "") return null;

  // Case A: Excel Decimal (e.g., 0.41666 for 10:00 AM)
  if (typeof val === 'number') {
    // Excel stores time as a fraction of a day (1.0 = 24 hours)
    const totalHours = val * 24;
    return totalHours;
  }

  // Case B: String (e.g., "10:00", "10:00 AM", "18:30")
  const str = String(val).trim().toUpperCase();
  
  // Regex to find HH:MM
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1], 10);
    let minutes = parseInt(match[2], 10);

    // Handle PM adjustment if "PM" exists in string
    if (str.includes("PM") && hours < 12) hours += 12;
    if (str.includes("AM") && hours === 12) hours = 0;

    return hours + (minutes / 60);
  }

  return null;
};

// 2. HELPER: Find column value regardless of casing/hyphens
const getValue = (row, ...candidates) => {
  const keys = Object.keys(row);
  for (let candidate of candidates) {
    // normalize candidate (remove spaces, hyphens, lowercase)
    const normalizedCand = candidate.toLowerCase().replace(/[- ]/g, '');
    
    // Find matching key in row
    const foundKey = keys.find(k => k.toLowerCase().replace(/[- ]/g, '') === normalizedCand);
    if (foundKey) return row[foundKey];
  }
  return null;
};

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = new IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload failed" });

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) return res.status(400).json({ error: "No file uploaded" });

    try {
      const workbook = XLSX.readFile(uploadedFile.filepath);
      const sheetName = workbook.SheetNames[0];
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // --- BUSINESS LOGIC START ---
      let totalExpectedHours = 0;
      let totalWorkedHours = 0;
      let leaves = 0;
      let workingDays = 0;

      const processedData = rawData.map((row) => {
        // 1. Get Clean Data using Fuzzy Match
        const dateRaw = getValue(row, 'Date', 'date');
        const inTimeRaw = getValue(row, 'In-Time', 'InTime', 'In Time');
        const outTimeRaw = getValue(row, 'Out-Time', 'OutTime', 'Out Time');

        // 2. Parse Date & Determine Day Type
        const dateObj = new Date(dateRaw); 
        // Note: If Excel dates are serial numbers (e.g. 45293), new Date() might fail.
        // Usually sheet_to_json handles this, but strictly speaking we trust the string format here.
        
        const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat

        let expected = 0;
        let dayType = 'Weekday';
        let isLeave = false;

        // Apply NMIMS Rules
        if (dayOfWeek === 0) {
          expected = 0; // Sunday Off
          dayType = 'Sunday';
        } else if (dayOfWeek === 6) {
          expected = 4.0; // Saturday Half Day
          dayType = 'Saturday';
          workingDays++;
        } else {
          expected = 8.5; // Mon-Fri
          dayType = 'Weekday';
          workingDays++;
        }

        // 3. Calculate Worked Hours
        const inTime = parseTime(inTimeRaw);
        const outTime = parseTime(outTimeRaw);
        let worked = 0;

        if (inTime !== null && outTime !== null) {
          worked = outTime - inTime;
          if (worked < 0) worked = 0; // Safety check
        } else if (expected > 0) {
           // If it's a working day but time is missing -> LEAVE
           isLeave = true;
           leaves++; 
        }

        totalExpectedHours += expected;
        totalWorkedHours += worked;

        return {
          Date: dateRaw,
          DayType: dayType,
          InTime: inTimeRaw || '-',
          OutTime: outTimeRaw || '-',
          workedHours: worked.toFixed(2),
          expectedHours: expected,
          isLeave: isLeave
        };
      });

      // 4. Productivity Calculation
      // Avoid division by zero
      const productivity = totalExpectedHours > 0 
        ? ((totalWorkedHours / totalExpectedHours) * 100).toFixed(2) 
        : "0.00";

      return res.status(200).json({
        message: "Analysis Complete",
        summary: {
          totalWorkingDays: workingDays,
          totalExpectedHours: totalExpectedHours,
          totalWorkedHours: totalWorkedHours.toFixed(2),
          leavesTaken: leaves,
          leavesAllowed: 2, // Hardcoded per requirement
          productivityScore: productivity
        },
        details: processedData
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error processing Excel data. Check file format." });
    }
  });
}