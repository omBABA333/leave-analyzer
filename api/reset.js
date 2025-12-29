import dbConnect from "./db";
import Attendance from "./models/Attendance";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();
    await Attendance.deleteMany({});
    
    return res.status(200).json({ message: "Database cleared successfully. You can now upload fresh data." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reset database" });
  }
}