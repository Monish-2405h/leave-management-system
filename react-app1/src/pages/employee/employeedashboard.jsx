import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import StatCard from "../../components/statcard";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Clock, XCircle, PlusCircle, ArrowRight, Calendar, Sparkles, AlertCircle, MessageSquare } from "lucide-react";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user.id || 1;

  useEffect(() => {
    Promise.all([
      api.get(`/leave/employee/${employeeId}`),
      api.get(`/leave/balances/${employeeId}`)
    ]).then(([resLeaves, resBalances]) => {
      setLeaves(Array.isArray(resLeaves.data) ? resLeaves.data : []);
      if (resBalances.data && resBalances.data.balances) {
        setBalances(resBalances.data.balances);
      }
    }).catch(err => {
      console.error("Error loading dashboard data:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [employeeId]);

  const approvedCount = leaves.filter(l => l.status === "Approved").length;
  const pendingCount = leaves.filter(l => l.status === "Pending").length;
  const rejectedCount = leaves.filter(l => l.status === "Rejected").length;

  const links = [
    { name: "Dashboard", path: "/employee/dashboard", action: () => navigate("/employee/dashboard") },
    { name: "Apply Leave", path: "/employee/apply", action: () => navigate("/employee/apply") },
    { name: "My Leaves", path: "/employee/my-leaves", action: () => navigate("/employee/my-leaves") }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar links={links} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Employee Portal" />

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Welcome Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1E1B4B 0%, #151C2C 100%)",
            padding: "28px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span className="badge badge-info" style={{ fontSize: "0.75rem" }}>
                  <Sparkles size={12} /> {user.department || "Engineering"} Department
                </span>
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#FFF" }}>
                Welcome Back, {user.name || "Monish Prakash"} 👋
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
                Track your annual leave allowances, submit absence requests, and inspect manager decisions.
              </p>
            </div>

            <button
              onClick={() => navigate("/employee/apply")}
              className="btn btn-primary"
              style={{ padding: "12px 22px", fontSize: "0.9rem" }}
            >
              <PlusCircle size={18} /> Apply New Leave
            </button>
          </div>

          {/* Leave Quota / Balance Cards */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
              Annual Leave Allowances & Balances
            </h3>

            {balances ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {Object.keys(balances).map(type => {
                  const item = balances[type];
                  const usedPct = item.quota > 0 ? Math.min(100, Math.round((item.used / item.quota) * 100)) : 0;
                  const isLow = item.remaining <= 2;
                  const barColor = isLow ? "#EF4444" : "#6366F1";

                  return (
                    <div key={type} className="glass-card" style={{ padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {type}
                        </span>
                        <span className={`badge ${isLow ? 'badge-rejected' : 'badge-approved'}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          {item.remaining} Left
                        </span>
                      </div>

                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        {item.used} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>/ {item.quota} Days Used</span>
                      </div>

                      <div className="quota-bar-track">
                        <div
                          className="quota-bar-fill"
                          style={{
                            width: `${usedPct}%`,
                            background: barColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading leave balances...</p>
              </div>
            )}
          </div>

          {/* Metric Overview Cards */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <StatCard
              title="Total Applications"
              value={leaves.length}
              subtitle="Submitted all time"
              icon={FileText}
              color="#6366F1"
            />
            <StatCard
              title="Approved Requests"
              value={approvedCount}
              subtitle="Confirmed by Manager"
              icon={CheckCircle}
              color="#10B981"
              badgeText="Approved"
            />
            <StatCard
              title="Pending Review"
              value={pendingCount}
              subtitle="Under review"
              icon={Clock}
              color="#F59E0B"
              badgeText="Pending"
            />
            <StatCard
              title="Declined Requests"
              value={rejectedCount}
              subtitle="Rejected or Cancelled"
              icon={XCircle}
              color="#EF4444"
            />
          </div>

          {/* Recent Applications Feed */}
          <div className="glass-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Recent Leave Submissions & Feedback
              </h3>
              <button
                onClick={() => navigate("/employee/my-leaves")}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                View History <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>Loading data...</p>
            ) : leaves.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                <Calendar size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
                <p>No leave requests found. Click "Apply New Leave" to submit your first application!</p>
              </div>
            ) : (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Dates Requested</th>
                      <th>Reason</th>
                      <th>Manager Remarks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.slice(0, 5).map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600 }}>{l.leave_type}</td>
                        <td style={{ fontSize: "0.85rem" }}>
                          {l.from_date ? new Date(l.from_date).toLocaleDateString() : '-'} to {l.to_date ? new Date(l.to_date).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {l.reason || 'N/A'}
                        </td>
                        <td>
                          {l.admin_remark ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <MessageSquare size={13} color="var(--primary)" /> {l.admin_remark}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Awaiting review</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${l.status ? l.status.toLowerCase() : 'pending'}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
