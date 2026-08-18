import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import StatCard from "../../components/statcard";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, Clock, AlertTriangle, ArrowRight, BarChart3, Activity, PieChart, Sparkles, Calendar, Users, Download, X } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    summary: { total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0 },
    byType: []
  });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConflictModal, setActiveConflictModal] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/leave/analytics"),
      api.get("/leave/all")
    ]).then(([resAnalytics, resLeaves]) => {
      setAnalytics(resAnalytics.data || { summary: {}, byType: [] });
      setLeaves(Array.isArray(resLeaves.data) ? resLeaves.data : []);
    }).catch(err => console.error("Admin dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/leave/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Leave_Analytics_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error exporting CSV data.");
    }
  };

  const { total = 0, approved = 0, pending = 0, rejected = 0 } = analytics.summary || {};
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const highRiskLeaves = leaves.filter(l => l.riskLevel === 'High' && l.status === 'Pending');

  const links = [
    { name: "Analytics Dashboard", path: "/admin/dashboard", action: () => navigate("/admin/dashboard") },
    { name: "Manage Leaves", path: "/admin/manage", action: () => navigate("/admin/manage") },
    { name: "Absence Calendar", path: "/admin/calendar", action: () => navigate("/admin/calendar") },
    { name: "Employee Directory", path: "/admin/employees", action: () => navigate("/admin/employees") }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar links={links} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Admin Executive Dashboard" />

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Header Banner */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)",
            padding: "28px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span className="badge badge-info">
                  <Sparkles size={12} /> AI Workload & Capacity Intelligence Active
                </span>
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#FFF" }}>
                Workload & Absence Control Center
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
                Evaluate employee leave trends, review AI workload risk scores, and manage team coverage.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{ padding: "12px 18px", fontSize: "0.85rem" }}
              >
                <Download size={16} /> Export Report
              </button>
              <button
                onClick={() => navigate("/admin/manage")}
                className="btn btn-primary"
                style={{ padding: "12px 20px" }}
              >
                Manage Requests ({pending}) <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* High Risk Alert Banner */}
          {highRiskLeaves.length > 0 && (
            <div style={{
              padding: "16px 20px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <AlertTriangle color="#F87171" size={24} />
                <div>
                  <h4 style={{ color: "#F87171", fontWeight: 700, fontSize: "0.95rem" }}>
                    ⚠️ {highRiskLeaves.length} High Overlap Risk Request(s) Flagged by AI
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.825rem" }}>
                    Multiple team members have requested overlapping dates. Review conflicts before approving.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    const first = highRiskLeaves[0];
                    setActiveConflictModal({ leave: first, conflicts: first.conflictDetails || [] });
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", borderColor: "rgba(239, 68, 68, 0.4)" }}
                >
                  🔍 Inspect Conflict
                </button>
                <button
                  onClick={() => navigate("/admin/manage")}
                  className="btn btn-danger"
                  style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                >
                  Review All ({highRiskLeaves.length})
                </button>
              </div>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <StatCard
              title="Total Requests"
              value={total}
              subtitle="All time submissions"
              icon={Activity}
              color="#6366F1"
            />
            <StatCard
              title="Pending Review"
              value={pending}
              subtitle="Action required"
              icon={Clock}
              color="#F59E0B"
              badgeText="Priority"
            />
            <StatCard
              title="Approval Rate"
              value={`${approvalRate}%`}
              subtitle={`${approved} approved, ${rejected} rejected`}
              icon={CheckCircle}
              color="#10B981"
            />
            <StatCard
              title="AI Risk Alerts"
              value={highRiskLeaves.length}
              subtitle="Overlap conflict warnings"
              icon={AlertTriangle}
              color="#EF4444"
              badgeText={highRiskLeaves.length > 0 ? "Attention" : "Clear"}
            />
          </div>

          {/* Quick Action Navigation Panels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div
              className="glass-card"
              onClick={() => navigate("/admin/calendar")}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)"
              }}>
                <Calendar size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                  Absence Calendar & Heatmap
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  View scheduled absences across the month
                </p>
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>

            <div
              className="glass-card"
              onClick={() => navigate("/admin/employees")}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--success)"
              }}>
                <Users size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                  Employee Directory & Quotas
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Manage team accounts and annual quotas
                </p>
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>
          </div>

          {/* Analytics Visualizations */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {/* Leave Type Breakdown */}
            <div className="glass-card" style={{ flex: 1, minWidth: "320px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <BarChart3 color="var(--primary)" size={20} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Leave Category Distribution
                </h3>
              </div>

              {analytics.byType.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No category metrics recorded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {analytics.byType.map((item, idx) => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];
                    const barColor = colors[idx % colors.length];

                    return (
                      <div key={item.leave_type}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.leave_type}</span>
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{item.count} ({pct}%)</span>
                        </div>
                        <div style={{
                          height: "10px",
                          width: "100%",
                          background: "var(--bg-input)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: "var(--radius-full)",
                            transition: "width 0.6s ease"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Ratio Bar Chart */}
            <div className="glass-card" style={{ flex: 1, minWidth: "320px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <PieChart color="#34D399" size={20} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Approval Status Ratios
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px" }}>
                    <span style={{ color: "var(--success)", fontWeight: 600 }}>Approved Requests ({approved})</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{total > 0 ? Math.round((approved / total) * 100) : 0}%</span>
                  </div>
                  <div style={{ height: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${total > 0 ? (approved / total) * 100 : 0}%`, background: "var(--success)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px" }}>
                    <span style={{ color: "var(--warning)", fontWeight: 600 }}>Pending Review ({pending})</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{total > 0 ? Math.round((pending / total) * 100) : 0}%</span>
                  </div>
                  <div style={{ height: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${total > 0 ? (pending / total) * 100 : 0}%`, background: "var(--warning)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px" }}>
                    <span style={{ color: "var(--danger)", fontWeight: 600 }}>Rejected Requests ({rejected})</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{total > 0 ? Math.round((rejected / total) * 100) : 0}%</span>
                  </div>
                  <div style={{ height: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${total > 0 ? (rejected / total) * 100 : 0}%`, background: "var(--danger)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: AI Conflict & Overlap Inspector */}
        {activeConflictModal && (
          <div className="modal-backdrop">
            <div className="modal-content animate-fade-in" style={{ maxWidth: "600px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle color="#F87171" size={22} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    AI Overlap Conflict Details
                  </h3>
                </div>
                <button
                  onClick={() => setActiveConflictModal(null)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{
                padding: "12px 16px",
                background: "rgba(99, 102, 241, 0.1)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                marginBottom: "20px"
              }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  Subject Employee: {activeConflictModal.leave?.name} ({activeConflictModal.leave?.leave_type})
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Requested Dates: {activeConflictModal.leave?.from_date ? new Date(activeConflictModal.leave.from_date).toLocaleDateString() : ''} - {activeConflictModal.leave?.to_date ? new Date(activeConflictModal.leave.to_date).toLocaleDateString() : ''}
                </div>
              </div>

              <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                Conflicting Absences on Overlapping Dates:
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                {activeConflictModal.conflicts && activeConflictModal.conflicts.length > 0 ? (
                  activeConflictModal.conflicts.map(c => (
                    <div key={c.id} style={{
                      padding: "12px 14px",
                      background: "var(--bg-input)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {c.department} • {c.leave_type}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {new Date(c.from_date).toLocaleDateString()} - {new Date(c.to_date).toLocaleDateString()}
                        </div>
                        <span className={`badge badge-${c.status.toLowerCase()}`} style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No conflicting requests identified.</p>
                )}
              </div>

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveConflictModal(null);
                    navigate("/admin/manage");
                  }}
                  style={{ fontSize: "0.85rem" }}
                >
                  Manage Requests <ArrowRight size={16} />
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveConflictModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
