import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";
import fs from "fs";

// Helper to parse "10:00 AM" or Excel decimal time
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  // If Excel sends a decimal (e.g. 0.41666 for 10:00 AM)
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.round(timeStr * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours + (minutes / 60);
  }
  // If string "10:00 AM"
  const date = new Date(`1970-01-01 ${timeStr}`);
  return date.getHours() + (date.getMinutes() / 60);
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
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // --- BUSINESS LOGIC START ---
      let totalExpectedHours = 0;
      let totalWorkedHours = 0;
      let leaves = 0;
      
      const processedData = data.map((row) => {
        // 1. Identify Date & Day
        // Excel dates might be serial numbers. This handles basic string dates for now.
        const dateObj = new Date(row.Date); 
        const day = dateObj.getDay(); // 0=Sun, 6=Sat

        // 2. Determine Expected Hours
        let expected = 0;
        let isLeave = false;

        if (day === 0) expected = 0; // Sunday
        else if (day === 6) expected = 4.0; // Saturday
        else expected = 8.5; // Mon-Fri

        // 3. Calculate Worked Hours
        const inTime = parseTime(row['In-Time']);
        const outTime = parseTime(row['Out-Time']);
        let worked = 0;

        if (inTime && outTime) {
          worked = outTime - inTime;
          // Handle lunch break? (Optional: subtract 30-60 mins if needed)
        } else if (expected > 0) {
           // If expected to work but no time logged -> Leave
           isLeave = true;
           leaves++; 
        }

        totalExpectedHours += expected;
        totalWorkedHours += worked;

        return {
          ...row,
          workedHours: worked.toFixed(2),
          expectedHours: expected,
          isLeave
        };
      });

      // 4. Calculate Productivity
      const productivity = totalExpectedHours > 0 
        ? ((totalWorkedHours / totalExpectedHours) * 100).toFixed(2) 
        : 0;

      // --- BUSINESS LOGIC END ---

      return res.status(200).json({
        message: "Analysis Complete",
        summary: {
          totalExpectedHours,
          totalWorkedHours: totalWorkedHours.toFixed(2),
          leavesTaken: leaves,
          productivityScore: `${productivity}%`
        },
        details: processedData
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error processing Excel data" });
    }
  });
}