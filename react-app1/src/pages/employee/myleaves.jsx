import { useEffect, useState } from "react";
import api from "../../services/api";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, PlusCircle, Trash2, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";

export default function MyLeaves() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = userObj.id || 1;

  const fetchLeaves = () => {
    setLoading(true);
    api.get(`/leave/employee/${employeeId}`)
      .then(res => {
        setLeaves(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error("Error fetching leaves:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, [employeeId]);

  const handleCancelLeave = async (id) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this pending leave request?");
    if (!confirmCancel) return;

    setCancellingId(id);
    try {
      const res = await api.put(`/leave/cancel/${id}`);
      if (res.data.success) {
        setLeaves(leaves.map(l => l.id === id ? { ...l, status: "Cancelled", admin_remark: "Cancelled by applicant" } : l));
      } else {
        alert(res.data.error || "Failed to cancel request.");
      }
    } catch (err) {
      alert("Error cancelling leave request. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesSearch = (l.leave_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.admin_remark || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const links = [
    { name: "Dashboard", path: "/employee/dashboard", action: () => navigate("/employee/dashboard") },
    { name: "Apply Leave", path: "/employee/apply", action: () => navigate("/employee/apply") },
    { name: "My Leaves", path: "/employee/my-leaves", action: () => navigate("/employee/my-leaves") }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar links={links} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="My Leave History" />

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Leave Application Records
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Inspect past leave submissions, manager feedback, and cancel pending requests.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={fetchLeaves} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                onClick={() => navigate("/employee/apply")}
                className="btn btn-primary"
              >
                <PlusCircle size={18} /> Apply Leave
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            {/* Status Tabs */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["All", "Approved", "Pending", "Rejected", "Cancelled"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: statusFilter === status ? "var(--primary)" : "var(--bg-input)",
                    color: statusFilter === status ? "#FFF" : "var(--text-secondary)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: "36px", padding: "8px 12px 8px 36px", fontSize: "0.85rem" }}
                placeholder="Search category, reason, or remark..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <p style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Loading records...</p>
            ) : filteredLeaves.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                <Calendar size={40} style={{ marginBottom: "10px", opacity: 0.4 }} />
                <p>No leave records match your filter criteria.</p>
              </div>
            ) : (
              <div className="custom-table-container" style={{ border: "none" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Leave Category</th>
                      <th>Dates Requested</th>
                      <th>Reason</th>
                      <th>Manager Feedback / Remarks</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.leave_type}</td>
                        <td style={{ fontSize: "0.85rem" }}>
                          {l.from_date ? new Date(l.from_date).toLocaleDateString() : '-'} to {l.to_date ? new Date(l.to_date).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ color: "var(--text-secondary)", maxWidth: "220px" }}>{l.reason || 'N/A'}</td>
                        <td>
                          {l.admin_remark ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <MessageSquare size={13} color="var(--primary)" /> {l.admin_remark}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${l.status ? l.status.toLowerCase() : 'pending'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {l.status === "Pending" ? (
                            <button
                              onClick={() => handleCancelLeave(l.id)}
                              disabled={cancellingId === l.id}
                              className="btn btn-secondary"
                              style={{ padding: "5px 10px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                            >
                              <Trash2 size={13} /> {cancellingId === l.id ? "Cancelling..." : "Cancel"}
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>-</span>
                          )}
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
