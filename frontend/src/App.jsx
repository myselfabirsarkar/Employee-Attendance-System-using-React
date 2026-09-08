import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AttendanceDashboard from "./dashboard/AttendanceDashboard.jsx";
import HRDashboard from "./dashboard/HRDashboard.jsx";
import { getCurrentUser, getStoredUser, logoutUser } from "./services/auth.js";

const navigate = (path) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

function App() {
  const [path, setPath] = useState(window.location.pathname || "/login");
  const [user, setUser] = useState(getStoredUser());
  const [checkingAuth, setCheckingAuth] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname || "/login");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch(() => {
        logoutUser();
        setUser(null);
        navigate("/login");
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    navigate(loggedInUser.role === "HR" ? "/hr" : "/dashboard");
  };

  const handleRegister = () => navigate("/login");

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate("/login");
  };

  if (checkingAuth) {
    return <div className="app-loading">Checking your session...</div>;
  }

  if (path === "/register") {
    return <Register onRegistered={handleRegister} onLogin={() => navigate("/login")} />;
  }

  if (path === "/dashboard") {
    if (!user) return <Login onLogin={handleLogin} onRegister={() => navigate("/register")} />;
    if (user.role === "HR") return <RedirectTo path="/hr" />;
    return <AttendanceDashboard user={user} onLogout={handleLogout} />;
  }

  if (path === "/hr") {
    if (!user) return <Login onLogin={handleLogin} onRegister={() => navigate("/register")} />;
    if (user.role !== "HR") return <RedirectTo path="/dashboard" />;
    return <HRDashboard user={user} onLogout={handleLogout} />;
  }

  return <Login onLogin={handleLogin} onRegister={() => navigate("/register")} />;
}

function RedirectTo({ path }) {
  useEffect(() => navigate(path), [path]);
  return <div className="app-loading">Redirecting...</div>;
}

export default App;
