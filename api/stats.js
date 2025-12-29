import dbConnect from "./db";
import Attendance from "./models/Attendance";

export default async function handler(req, res) {
  // 1. Connect to DB
  try {
    await dbConnect();
  } catch (error) {
    return res.status(500).json({ error: "Database connection failed" });
  }

  // 2. Handle GET Request
  if (req.method === "GET") {
    const { month } = req.query; // Expecting "2025-01" format

    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }

    try {
      // 3. Query DB: Find dates starting with "YYYY-MM"
      // Since we store date as String "YYYY-MM-DD", regex works perfectly.
      const regex = new RegExp(`^${month}`);
      const records = await Attendance.find({ date: { $regex: regex } }).sort({ date: 1 });

      if (records.length === 0) {
        return res.status(200).json({ 
          message: "No records found for this month", 
          summary: null, 
          details: [] 
        });
      }

      // 4. Calculate Summary Stats on the fly
      let totalExpected = 0;
      let totalWorked = 0;
      let leaves = 0;
      let employeeName = records[0].employeeName || "Unknown";

      records.forEach(r => {
        totalExpected += r.expectedHours || 0;
        totalWorked += r.workedHours || 0;
        if (r.isLeave) leaves++;
      });

      const productivity = totalExpected > 0 
        ? ((totalWorked / totalExpected) * 100).toFixed(2) 
        : "0.00";

      // 5. Return Data
      return res.status(200).json({
        summary: {
          employeeName,
          totalExpected,
          totalWorked: totalWorked.toFixed(2),
          leaves,
          productivity
        },
        details: records
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}