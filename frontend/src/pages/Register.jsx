import { useState } from "react";
import { UserRound, Mail, Lock, UserPlus } from "lucide-react";
import { registerUser } from "../services/auth.js";
import "./Register.css";

export default function Register({ onRegistered, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      await registerUser(name, email, password);
      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(onRegistered, 700);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="brand dark">
          <span className="brand-mark">
            <UserPlus size={22} />
          </span>
          Employee Attendance
        </div>

        <h1>Create employee account</h1>

        <p className="register-description">
          Registration creates an EMPLOYEE account with the default leave balance.
        </p>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form className="register-form" onSubmit={submit}>

          <label>Full name</label>
          <div className="field">
            <UserRound size={18} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee name"
              required
            />
          </div>

          <label>Email address</label>
          <div className="field">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              required
            />
          </div>

          <label>Password</label>
          <div className="field">
            <Lock size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <label>Confirm password</label>
          <div className="field">
            <Lock size={18} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        <p className="switch-text">
          Already registered?{" "}
          <button type="button" onClick={onLogin}>
            Back to login
          </button>
        </p>

      </div>
    </div>
  );
}