import { useEffect, useState } from "react";
import { LogOut, RefreshCw, Users, Clock3, CalendarCheck2, AlertTriangle } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../services/auth.js";
import "./HRDashboard.css";

const fmtTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const badge = (status) => <span className={`status ${String(status).toLowerCase()}`}>{String(status).replaceAll("_", " ")}</span>;

export default function HRDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const client = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${token}` } });

  const load = async () => {
    setLoading(true); setMessage("");
    try {
      const [overviewRes, employeesRes] = await Promise.all([client.get("/hr/overview"), client.get("/hr/employees")]);
      setOverview(overviewRes.data);
      setEmployees(employeesRes.data.employees);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to load HR dashboard.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const processDeductions = async () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    try {
      const res = await client.post("/hr/process-late-deductions", { month, year });
      setMessage(res.data.message);
      await load();
    } catch (err) { setMessage(err?.response?.data?.message || "Unable to process deductions."); }
  };

  return <div className="hr-page">
    <header className="hr-header"><div><h1>HR Dashboard</h1><p>Welcome, {user.name}. Monitor today's workforce and employee attendance.</p></div><div className="header-actions"><button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button><button className="logout-button" onClick={onLogout}><LogOut size={16}/> Logout</button></div></header>
    {message && <div className="hr-message">{message}</div>}
    <section className="metric-grid">
      <Metric icon={<Users />} label="Employees" value={employees.length}/>
      <Metric icon={<CalendarCheck2 />} label="Present today" value={overview?.totalPresent ?? 0}/>
      <Metric icon={<Clock3 />} label="Late today" value={overview?.totalLate ?? 0}/>
      <Metric icon={<AlertTriangle />} label="Half day / absent" value={(overview?.totalHalfDay ?? 0) + (overview?.totalAbsent ?? 0)}/>
    </section>
    <section className="panel"><div className="panel-head"><div><h2>Today's attendance</h2><p>Real-time status for every employee with a punch record.</p></div><button className="secondary-button" onClick={processDeductions}>Process monthly leave deduction</button></div>
      <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead><tbody>{(overview?.logs || []).map((log) => <tr key={log._id}><td><strong>{log.userId?.name || "Unknown"}</strong><span>{log.userId?.email || ""}</span></td><td>{log.date}</td><td>{fmtTime(log.checkIn)}</td><td>{fmtTime(log.checkOut)}</td><td>{Number(log.totalHours || 0).toFixed(2)}</td><td>{badge(log.status)}</td></tr>)}</tbody></table>{overview && overview.logs.length === 0 && <div className="empty">No attendance records have been created today.</div>}</div>
    </section>
    <section className="panel"><div className="panel-head"><div><h2>Employee directory</h2><p>Current leave balance and account role.</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Leave balance</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee._id}><td>{employee.name}</td><td>{employee.email}</td><td>{badge(employee.role)}</td><td>{employee.casualLeaveBalance} days</td></tr>)}</tbody></table></div></section>
  </div>;
}

function Metric({ icon, label, value }) { return <div className="metric"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
