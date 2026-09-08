import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, LogOut } from 'lucide-react';
import { API_BASE_URL } from '../services/auth.js';
import './AttendanceDashboard.css';

const dateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const formatTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const hours = (log) => {
  if (!log?.checkIn) return 0;
  const end = log.checkOut ? new Date(log.checkOut) : new Date();
  return Math.max(0, (end - new Date(log.checkIn)) / 3600000);
};

export default function AttendanceDashboard({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const today = dateKey();

  const api = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  };

  const load = async () => {
    try {
      const data = await api('/my-summary');
      setUser(data.user);
      setLogs(data.logs || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => { load(); }, []);

  const todayLog = useMemo(() => logs.find((log) => log.date === today), [logs, today]);
  const currentHours = todayLog ? hours(todayLog) : 0;

  const checkIn = async () => {
    setLoading(true); setMessage('');
    try { const data = await api('/check-in', { method: 'POST' }); setMessage(data.message); await load(); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  const checkOut = async () => {
    setLoading(true); setMessage('');
    try { const data = await api('/check-out', { method: 'POST' }); setMessage(data.message); await load(); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  return <div className="attendance-page"><div className="attendance-container">
    <header className="attendance-header"><div><h1>Employee Dashboard</h1><p>Track today's attendance and your recent working hours.</p></div><div className="header-right"><span className="leave-chip">Leave balance: {user?.casualLeaveBalance ?? 0} days</span><button className="logout-control" onClick={onLogout}><LogOut size={16}/> Logout</button></div></header>
    {message && <div className="attendance-alert">{message}<button onClick={() => setMessage('')}>Dismiss</button></div>}
    <section className="attendance-stats"><div className="attendance-stat-card"><div className="attendance-stat-icon"><Clock3 size={23}/></div><div><p>Today's hours</p><h2>{currentHours.toFixed(2)} hrs</h2></div></div><div className="attendance-stat-card"><div className="attendance-stat-icon"><CheckCircle2 size={23}/></div><div><p>Today's status</p><h2>{todayLog?.status || 'NOT STARTED'}</h2></div></div><div className="attendance-stat-card"><div className="attendance-stat-icon"><Calendar size={23}/></div><div><p>Employee</p><h2>{user?.name || 'Employee'}</h2></div></div></section>
    <section className="attendance-card"><div className="attendance-card-header"><div><h2>Today's attendance</h2><p>{today} · Shift starts 09:00 AM with 15-minute grace period.</p></div></div><div className="attendance-actions"><div className="attendance-time"><span>Check in</span><strong>{formatTime(todayLog?.checkIn)}</strong></div><div className="attendance-time"><span>Check out</span><strong>{formatTime(todayLog?.checkOut)}</strong></div><button className="attendance-action-button check-in-button" onClick={checkIn} disabled={loading || !!todayLog}>Check In</button><button className="attendance-action-button check-out-button" onClick={checkOut} disabled={loading || !todayLog || !!todayLog?.checkOut}>Check Out</button></div></section>
    <section className="attendance-card"><div className="attendance-card-header"><div><h2>Attendance status history</h2><p>Your most recent attendance records.</p></div></div><div className="attendance-table-wrapper"><table className="attendance-table"><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Working Hours</th><th>Status</th></tr></thead><tbody>{logs.map((log) => <tr key={log._id}><td>{log.date}</td><td>{formatTime(log.checkIn)}</td><td>{formatTime(log.checkOut)}</td><td>{Number(log.totalHours || 0).toFixed(2)} hrs</td><td><span className={`attendance-status ${String(log.status).toLowerCase()}`}>{String(log.status).replaceAll('_', ' ')}</span></td></tr>)}</tbody></table>{logs.length === 0 && <div className="empty-attendance">No attendance records yet.</div>}</div></section>
  </div></div>;
}
