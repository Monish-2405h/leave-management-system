import { LogOut, User, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "user";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const email = user.email || (role === "admin" ? "admin@system.com" : "employee@system.com");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 28px",
      background: "var(--bg-sidebar)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </h2>
        <span className="badge badge-info" style={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
          {role === "admin" ? <Shield size={12} /> : <User size={12} />}
          {role} Portal
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 14px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border)"
        }}>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#FFF"
          }}>
            {email.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {email}
          </span>
        </div>

        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
