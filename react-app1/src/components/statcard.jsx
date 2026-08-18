export default function StatCard({ title, value, subtitle, icon: Icon, color = "#6366F1", badgeText }) {
  return (
    <div className="glass-card animate-fade-in" style={{
      flex: 1,
      minWidth: "220px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Glow Pill */}
      <div style={{
        position: "absolute",
        top: "-20px",
        right: "-20px",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: color,
        opacity: 0.1,
        filter: "blur(20px)"
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            background: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>
          {value}
        </h3>
        {badgeText && (
          <span style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: color,
            background: `${color}15`,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)"
          }}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
