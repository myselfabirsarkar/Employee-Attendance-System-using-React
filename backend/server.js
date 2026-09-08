const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const { seedHRUser } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Employee Attendance API is running' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api', attendanceRoutes);

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in backend/.env');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in backend/.env');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await seedHRUser();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Backend startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
