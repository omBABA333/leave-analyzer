const mongoose = require('mongoose');
const AttendanceSchema = new mongoose.Schema({
  employeeId: String,
  employeeName: String,
  date: { type: Date, required: true },
  inTime: String,
  outTime: String,
  workedHours: Number,
  isLeave: { type: Boolean, default: false },
  month: String // '2025-12'
});
module.exports = mongoose.model('Attendance', AttendanceSchema);
