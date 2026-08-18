import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck, UserCheck, Sparkles, Building2, ArrowRight, UserPlus, LogIn, CheckCircle } from "lucide-react";

export default function Login({ setUser }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [role, setRole] = useState("employee"); // 'employee' | 'admin'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
        role
      });

      if (res.data.success) {
        const userObj = res.data.user || { email, role };
        const token = res.data.token;

        if (token) {
          localStorage.setItem("token", token);
        }
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(userObj));
        setUser({ role, ...userObj });

        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/employee/dashboard");
        }
      } else {
        setErrorMsg(res.data.error || "Invalid credentials. Please check your username/email and password.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to connect to backend server. Make sure Node.js is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        department
      });

      if (res.data.success) {
        setSuccessMsg("Account created successfully! Logging you in...");
        const userObj = res.data.user;
        const token = res.data.token;

        localStorage.setItem("token", token);
        localStorage.setItem("role", "employee");
        localStorage.setItem("user", JSON.stringify(userObj));
        setUser(userObj);

        setTimeout(() => {
          navigate("/employee/dashboard");
        }, 1200);
      } else {
        setErrorMsg(res.data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoRole) => {
    setMode("login");
    setRole(demoRole);
    if (demoRole === "employee") {
      setEmail("monishprakash45@gmail.com");
      setPassword("123456");
    } else {
      setEmail("admin");
      setPassword("admin123");
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-main)"
    }}>
      {/* Left Banner */}
      <div style={{
        flex: 1.2,
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)",
        padding: "60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glow Background Circle */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#6366F1",
          opacity: 0.15,
          filter: "blur(80px)"
        }} />

        <div style={{ zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              boxShadow: "var(--shadow-glow)"
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFF" }}>
                Leave<span style={{ color: "#818CF8" }}>AI</span>
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Enterprise Leave & Capacity Management
              </p>
            </div>
          </div>

          <span className="badge badge-info" style={{ marginBottom: "20px" }}>
            <Sparkles size={14} /> AI & Data Science B.Tech Project
          </span>

          <h1 style={{ fontSize: "2.8rem", fontWeight: 800, color: "#FFF", lineHeight: 1.15, marginBottom: "20px" }}>
            Intelligent Workforce <br />
            <span style={{
              background: "linear-gradient(135deg, #818CF8 0%, #34D399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Leave & Quota System</span>
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "480px" }}>
            Automate absence workflows, prevent workload shortages with AI overlap detection, manage employee quotas, and track department analytics.
          </p>
        </div>

        {/* Feature Highlights */}
        <div style={{ display: "flex", gap: "16px", zIndex: 1 }}>
          <div style={{
            flex: 1,
            padding: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <ShieldCheck size={20} color="#818CF8" style={{ marginBottom: "8px" }} />
            <h4 style={{ fontSize: "0.9rem", color: "#FFF", fontWeight: 600 }}>Secured Auth</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bcrypt encryption & JWT Tokens</p>
          </div>

          <div style={{
            flex: 1,
            padding: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <Sparkles size={20} color="#34D399" style={{ marginBottom: "8px" }} />
            <h4 style={{ fontSize: "0.9rem", color: "#FFF", fontWeight: 600 }}>AI Overlap Analysis</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Real-time team conflict detection</p>
          </div>
        </div>
      </div>

      {/* Right Login / Register Card */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px"
      }}>
        <div className="glass-card animate-fade-in" style={{
          width: "100%",
          maxWidth: "450px",
          padding: "36px"
        }}>
          {/* Header Switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {mode === "login" ? "Welcome Back 👋" : "Create Employee Account 🚀"}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                {mode === "login" ? "Sign in to access your portal" : "Register to submit & track your leaves"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--primary)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </div>

          {/* Role Segment Toggle (Only in Login Mode) */}
          {mode === "login" && (
            <div style={{
              display: "flex",
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md)",
              padding: "4px",
              marginBottom: "24px",
              border: "1px solid var(--border)"
            }}>
              <button
                type="button"
                onClick={() => setRole("employee")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: role === "employee" ? "var(--primary)" : "transparent",
                  color: role === "employee" ? "#FFF" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease"
                }}
              >
                <UserCheck size={16} /> Employee
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: role === "admin" ? "var(--primary)" : "transparent",
                  color: role === "admin" ? "#FFF" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease"
                }}
              >
                <ShieldCheck size={16} /> Admin Manager
              </button>
            </div>
          )}

          {errorMsg && (
            <div style={{
              padding: "12px 16px",
              background: "var(--danger-bg)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "0.85rem",
              marginBottom: "20px"
            }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: "12px 16px",
              background: "var(--success-bg)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--success)",
              fontSize: "0.85rem",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}

          {/* Form */}
          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>{role === "admin" ? "Username" : "Email Address"}</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }} />
                  <input
                    type={role === "admin" ? "text" : "email"}
                    className="form-input"
                    style={{ paddingLeft: "42px" }}
                    placeholder={role === "admin" ? "admin" : "monishprakash45@gmail.com"}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: "42px" }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "0.95rem" }}
              >
                {loading ? "Signing in..." : `Sign in as ${role === 'admin' ? 'Admin' : 'Employee'}`}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. alex@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "0.95rem" }}
              >
                <UserPlus size={18} /> {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Quick Demo Credentials Assistant */}
          {mode === "login" && (
            <div style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
              textAlign: "center"
            }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "10px", fontWeight: 600 }}>
                ⚡ Quick Demo Credentials Fill:
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fillDemoCredentials("employee")}
                  style={{ flex: 1, fontSize: "0.75rem", padding: "6px 10px" }}
                >
                  Fill Employee
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fillDemoCredentials("admin")}
                  style={{ flex: 1, fontSize: "0.75rem", padding: "6px 10px" }}
                >
                  Fill Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
