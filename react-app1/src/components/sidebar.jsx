import { LayoutDashboard, PlusCircle, ListFilter, Activity, Sparkles, Building2, Calendar, Users } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Sidebar({ links }) {
  const location = useLocation();

  const getIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("dashboard") || lower.includes("analytics")) return <LayoutDashboard size={18} />;
    if (lower.includes("apply")) return <PlusCircle size={18} />;
    if (lower.includes("my leaves") || lower.includes("manage")) return <ListFilter size={18} />;
    if (lower.includes("calendar") || lower.includes("schedule")) return <Calendar size={18} />;
    if (lower.includes("employee") || lower.includes("team") || lower.includes("directory")) return <Users size={18} />;
    return <Sparkles size={18} />;
  };

  return (
    <aside style={{
      width: "250px",
      minHeight: "100vh",
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      gap: "24px"
    }}>
      {/* Brand Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 12px"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFF",
          boxShadow: "var(--shadow-glow)"
        }}>
          <Building2 size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Leave<span style={{ color: "var(--primary)" }}>AI</span>
          </h1>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Enterprise Portal
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {links.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={idx}
              onClick={link.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive ? "var(--primary-light)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {getIcon(link.name)}
              <span>{link.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Banner */}
      <div style={{
        marginTop: "auto",
        padding: "16px",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        textAlign: "center"
      }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Leave & Capacity Intelligence
        </p>
        <span className="badge badge-info" style={{ marginTop: "6px", fontSize: "0.65rem" }}>
          AI Overlap & Quota Active
        </span>
      </div>
    </aside>
  );
}
