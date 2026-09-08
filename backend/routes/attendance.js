const express = require('express');
const router = express.Router();
const { Attendance, User, LeaveDeduction } = require('../models');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const STANDARD_START_HOUR = 9;
const GRACE_PERIOD_MINUTES = 15;

const pad = (n) => String(n).padStart(2, '0');
const getDateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const getLateThreshold = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), STANDARD_START_HOUR, GRACE_PERIOD_MINUTES, 0, 0);

router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'EMPLOYEE') return res.status(403).json({ message: 'Only employees can check in.' });
    const date = getDateKey();
    const now = new Date();
    const exists = await Attendance.findOne({ userId: req.user.id, date });
    if (exists) return res.status(400).json({ message: 'You have already checked in today.' });

    const status = now > getLateThreshold(now) ? 'LATE' : 'PRESENT';
    const log = await Attendance.create({ userId: req.user.id, date, checkIn: now, status });
    res.status(201).json({ message: status === 'LATE' ? 'Check-in successful. You are marked late.' : 'Check-in successful.', data: log });
  } catch (error) {
    res.status(500).json({ message: 'Check-in failed.', error: error.message });
  }
});

router.post('/check-out', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'EMPLOYEE') return res.status(403).json({ message: 'Only employees can check out.' });
    const date = getDateKey();
    const now = new Date();
    const log = await Attendance.findOne({ userId: req.user.id, date });
    if (!log) return res.status(404).json({ message: 'No check-in record found for today.' });
    if (log.checkOut) return res.status(400).json({ message: 'You have already checked out today.' });

    const hours = Math.max(0, (now - log.checkIn) / 3600000);
    log.checkOut = now;
    log.totalHours = Number(hours.toFixed(2));
    if (log.totalHours < 4) log.status = 'ABSENT';
    else if (log.totalHours < 8) log.status = 'HALF_DAY';
    await log.save();

    res.json({ message: 'Check-out successful.', data: log });
  } catch (error) {
    res.status(500).json({ message: 'Check-out failed.', error: error.message });
  }
});

router.get('/my-summary', authenticateToken, async (req, res) => {
  try {
    const [user, logs] = await Promise.all([
      User.findById(req.user.id).select('-password'),
      Attendance.find({ userId: req.user.id }).sort({ date: -1, createdAt: -1 }).limit(60)
    ]);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user, logs });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load attendance summary.', error: error.message });
  }
});

router.get('/hr/employees', authenticateToken, authorizeRole('HR'), async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['EMPLOYEE', 'HR'] } }).select('-password').sort({ role: 1, name: 1 });
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load employees.', error: error.message });
  }
});

router.get('/hr/overview', authenticateToken, authorizeRole('HR'), async (req, res) => {
  try {
    const today = getDateKey();
    const logs = await Attendance.find({ date: today }).populate('userId', 'name email role').sort({ checkIn: 1 });
    res.json({
      date: today,
      totalPresent: logs.filter((l) => l.status === 'PRESENT').length,
      totalLate: logs.filter((l) => l.status === 'LATE').length,
      totalHalfDay: logs.filter((l) => l.status === 'HALF_DAY').length,
      totalAbsent: logs.filter((l) => l.status === 'ABSENT').length,
      logs
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load HR overview.', error: error.message });
  }
});

router.post('/hr/process-late-deductions', authenticateToken, authorizeRole('HR'), async (req, res) => {
  try {
    const now = new Date();
    const month = String(req.body.month || now.getMonth() + 1).padStart(2, '0');
    const year = Number(req.body.year || now.getFullYear());
    if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(String(year))) return res.status(400).json({ message: 'Invalid month/year.' });

    const regex = new RegExp(`^${year}-${month}-`);
    const lateLogs = await Attendance.aggregate([
      { $match: { date: { $regex: regex }, status: 'LATE' } },
      { $group: { _id: '$userId', lateCount: { $sum: 1 } } }
    ]);

    const deductionCap = 12;
    const results = [];
    for (const record of lateLogs) {
      const deductionDays = Math.floor(record.lateCount / 3) * 0.5;
      if (deductionDays <= 0) continue;
      const employee = await User.findById(record._id);
      if (!employee || employee.role !== 'EMPLOYEE') continue;

      const existing = await LeaveDeduction.findOne({ userId: employee._id, year, month });
      if (existing) {
        results.push({ userId: employee._id, email: employee.email, lateCount: existing.lateCount, deductedDays: existing.deductedDays, alreadyProcessed: true });
        continue;
      }

      const actualDeduction = Math.min(deductionDays, employee.casualLeaveBalance, deductionCap);
      if (actualDeduction > 0) {
        employee.casualLeaveBalance = Number(Math.max(0, employee.casualLeaveBalance - actualDeduction).toFixed(1));
        await employee.save();
      }
      await LeaveDeduction.create({ userId: employee._id, year, month, lateCount: record.lateCount, deductedDays: actualDeduction });
      results.push({ userId: employee._id, email: employee.email, lateCount: record.lateCount, deductedDays: actualDeduction, alreadyProcessed: false });
    }

    res.json({ message: `Leave deductions calculated for ${year}-${month}.`, results });
  } catch (error) {
    res.status(500).json({ message: 'Leave deduction calculation failed.', error: error.message });
  }
});

module.exports = router;
