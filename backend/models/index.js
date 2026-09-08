const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['EMPLOYEE', 'HR'], default: 'EMPLOYEE' },
  casualLeaveBalance: { type: Number, default: 12, min: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const leaveDeductionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  month: { type: String, required: true },
  lateCount: { type: Number, required: true },
  deductedDays: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
leaveDeductionSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  totalHours: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'],
    default: 'PRESENT'
  }
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  LeaveDeduction: mongoose.model('LeaveDeduction', leaveDeductionSchema)
};
