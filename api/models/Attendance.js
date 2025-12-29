import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  employeeName: String,
  date: String,
  inTime: String,
  outTime: String,
  workedHours: Number,
  expectedHours: Number,
  isLeave: Boolean,
  status: String,
  dayType: String,
  uploadedAt: { type: Date, default: Date.now }
});

// Check if model exists to prevent "OverwriteModelError" in serverless
export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);