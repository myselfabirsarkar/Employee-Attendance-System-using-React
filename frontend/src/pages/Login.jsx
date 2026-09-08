import { useState } from "react";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { loginUser } from "../services/auth.js";
import "./Login.css";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      onLogin(data.user);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="brand"><span className="brand-mark"><LogIn size={22} /></span> Employee Attendance</div>
          <div>
            <h1>Attendance made simple.</h1>
            <p>Secure employee sign-in, accurate hours, live status tracking and an HR overview in one place.</p>
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-card-inner">
            <h2>Welcome back</h2>
            <p className="muted">Sign in to continue to your attendance dashboard.</p>
            {error && <div className="alert error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>Email address</label>
              <div className="field"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
              <label>Password</label>
              <div className="field"><Lock size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /><button className="icon-button" type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              <button className="primary-button" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
            </form>
            <p className="switch-text">Don't have an account? <button type="button" onClick={onRegister}>Create employee account</button></p>
            <div className="hint">HR accounts are created automatically by the backend seed.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
