import { useEffect, useState } from "react";
import api from "../../services/api";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle, XCircle, AlertTriangle, Sparkles, RefreshCw, Download, MessageSquare, X, Users, Calendar } from "lucide-react";

export default function ManageLeave() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Modal States
  const [activeRemarkModal, setActiveRemarkModal] = useState(null); // { id, name, type: 'Approved' | 'Rejected' }
  const [adminRemark, setAdminRemark] = useState("");
  const [activeConflictModal, setActiveConflictModal] = useState(null); // { leave, conflictDetails }

  const fetchLeaves = () => {
    setLoading(true);
    api.get("/leave/all")
      .then(res => setLeaves(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error fetching all leaves:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const openDecisionModal = (leave, actionType) => {
    setActiveRemarkModal({
      id: leave.id,
      name: leave.name,
      type: actionType
    });
    setAdminRemark(actionType === "Approved" ? "Approved by Manager" : "Declined due to workload / schedule conflict");
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!activeRemarkModal) return;

    const { id, type } = activeRemarkModal;
    setProcessingId(id);

    try {
      await api.put(`/leave/update/${id}`, {
        status: type,
        admin_remark: adminRemark.trim()
      });

      setLeaves(leaves.map(l =>
        l.id === id ? { ...l, status: type, admin_remark: adminRemark.trim() } : l
      ));
      setActiveRemarkModal(null);
    } catch (err) {
      alert("Failed to update status. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/leave/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Leave_Records_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error exporting CSV data.");
    }
  };

  const filteredLeaves = leaves.filter(l => {
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesSearch = (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.leave_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
        <Navbar title="Manage Employee Leaves" />

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Employee Leave Requests & Decision Control
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Review requests with automated AI overlap risk scores, provide manager remarks, and export reports.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleExportCSV} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
                <Download size={16} /> Export CSV
              </button>
              <button onClick={fetchLeaves} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["All", "Pending", "Approved", "Rejected", "Cancelled"].map(status => (
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

            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: "36px", padding: "8px 12px 8px 36px", fontSize: "0.85rem" }}
                placeholder="Search employee, dept, or reason..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Leave Management Table */}
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <p style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Analyzing database records...</p>
            ) : filteredLeaves.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                <Sparkles size={36} style={{ marginBottom: "10px", opacity: 0.4 }} />
                <p>No leave applications match your search criteria.</p>
              </div>
            ) : (
              <div className="custom-table-container" style={{ border: "none" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Category</th>
                      <th>Dates Requested</th>
                      <th>AI Risk Level (Click to Inspect)</th>
                      <th>NLP Reason Classification</th>
                      <th>Status & Remarks</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map(l => {
                      const riskClass = l.riskLevel === 'High' ? 'risk-pill-high' :
                                        l.riskLevel === 'Medium' ? 'risk-pill-medium' : 'risk-pill-low';

                      return (
                        <tr key={l.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {l.department || "Engineering"} • {l.email}
                            </div>
                          </td>
                          <td style={{ fontWeight: 500 }}>{l.leave_type}</td>
                          <td style={{ fontSize: "0.85rem" }}>
                            {l.from_date ? new Date(l.from_date).toLocaleDateString() : '-'} to {l.to_date ? new Date(l.to_date).toLocaleDateString() : '-'}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                if (l.overlappingCount > 0) {
                                  setActiveConflictModal({ leave: l, conflicts: l.conflictDetails || [] });
                                }
                              }}
                              className={riskClass}
                              style={{ border: "none", cursor: l.overlappingCount > 0 ? "pointer" : "default" }}
                              title={l.overlappingCount > 0 ? "Click to view conflicting team members" : "No conflicts detected"}
                            >
                              {l.riskLevel === 'High' && <AlertTriangle size={12} />}
                              {l.riskLevel} Risk ({l.riskScore}%)
                              {l.overlappingCount > 0 && <span style={{ opacity: 0.8, fontSize: "0.7rem" }}>• {l.overlappingCount} Overlaps 🔍</span>}
                            </button>
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: "0.75rem" }}>
                              {l.categoryTag || 'General Request'}
                            </span>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              "{l.reason}"
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${l.status ? l.status.toLowerCase() : 'pending'}`}>
                              {l.status}
                            </span>
                            {l.admin_remark && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                💬 {l.admin_remark}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                              <button
                                onClick={() => openDecisionModal(l, "Approved")}
                                disabled={processingId === l.id || l.status === "Approved"}
                                className="btn btn-success"
                                style={{ padding: "6px 12px", fontSize: "0.75rem", opacity: l.status === "Approved" ? 0.5 : 1 }}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => openDecisionModal(l, "Rejected")}
                                disabled={processingId === l.id || l.status === "Rejected"}
                                className="btn btn-danger"
                                style={{ padding: "6px 12px", fontSize: "0.75rem", opacity: l.status === "Rejected" ? 0.5 : 1 }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Admin Remarks & Decision Confirmation */}
        {activeRemarkModal && (
          <div className="modal-backdrop">
            <div className="modal-content animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {activeRemarkModal.type === "Approved" ? "✅ Confirm Leave Approval" : "❌ Confirm Leave Rejection"}
                </h3>
                <button
                  onClick={() => setActiveRemarkModal(null)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                You are marking the leave for <strong>{activeRemarkModal.name}</strong> as <strong>{activeRemarkModal.type}</strong>. You can attach an optional feedback message for the employee.
              </p>

              <form onSubmit={handleDecisionSubmit}>
                <div className="form-group">
                  <label>Manager Remark / Note</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    value={adminRemark}
                    onChange={e => setAdminRemark(e.target.value)}
                    placeholder="Enter reason or handover notes..."
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveRemarkModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={activeRemarkModal.type === "Approved" ? "btn btn-success" : "btn btn-danger"}
                  >
                    Confirm {activeRemarkModal.type}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: AI Conflict & Overlap Inspector */}
        {activeConflictModal && (
          <div className="modal-backdrop">
            <div className="modal-content animate-fade-in" style={{ maxWidth: "600px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle color="#F87171" size={22} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    AI Overlap Conflict Inspector
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
                  Subject Request: {activeConflictModal.leave.name} ({activeConflictModal.leave.leave_type})
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Dates: {new Date(activeConflictModal.leave.from_date).toLocaleDateString()} - {new Date(activeConflictModal.leave.to_date).toLocaleDateString()}
                </div>
              </div>

              <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                Conflicting Team Members Absent on Overlapping Dates ({activeConflictModal.conflicts.length}):
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                {activeConflictModal.conflicts.map(c => (
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
                ))}
              </div>

              <div style={{ marginTop: "24px", textAlign: "right" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveConflictModal(null)}
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
