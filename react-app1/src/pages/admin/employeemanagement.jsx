import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Search, Trash2, Mail, Building, ShieldCheck, X, CheckCircle, RefreshCw } from "lucide-react";

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // New Employee Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "Software Engineering",
    casual_quota: 12,
    medical_quota: 10,
    paid_quota: 15
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchEmployees = () => {
    setLoading(true);
    api.get("/employees")
      .then(res => {
        setEmployees(res.data?.employees || []);
      })
      .catch(err => console.error("Error fetching employees:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    try {
      const res = await api.post("/employees", formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          department: "Software Engineering",
          casual_quota: 12,
          medical_quota: 10,
          paid_quota: 15
        });
        fetchEmployees();
      } else {
        setFormError(res.data.error || "Failed to create employee.");
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Error creating employee. Please check server.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    const confirmDel = window.confirm(`Are you sure you want to remove employee "${name}"?`);
    if (!confirmDel) return;

    setDeletingId(id);
    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        setEmployees(employees.filter(e => e.id !== id));
      } else {
        alert(res.data.error || "Failed to delete employee.");
      }
    } catch (err) {
      alert("Error deleting employee.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEmployees = employees.filter(e =>
    (e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Navbar title="Employee Directory & Quota Management" />

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Team Members & Annual Quotas
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Add new team members, manage department assignments, and configure leave allowances.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={fetchEmployees} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
              >
                <UserPlus size={18} /> Add New Employee
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass-card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: "36px", padding: "8px 12px 8px 36px", fontSize: "0.85rem" }}
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Total Active Employees: {filteredEmployees.length}
            </span>
          </div>

          {/* Employee Directory Table */}
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <p style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Loading employee directory...</p>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                <Users size={36} style={{ marginBottom: "10px", opacity: 0.4 }} />
                <p>No team members match your search criteria.</p>
              </div>
            ) : (
              <div className="custom-table-container" style={{ border: "none" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Leave Quotas (C / M / P)</th>
                      <th>Leave Activity</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{emp.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID #{emp.id}</div>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {emp.email}
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: "0.75rem" }}>
                            {emp.department || "Engineering"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            🌴 {emp.casual_quota || 12}d | 🏥 {emp.medical_quota || 10}d | 💰 {emp.paid_quota || 15}d
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-approved" style={{ fontSize: "0.7rem", padding: "2px 8px", marginRight: "6px" }}>
                            {emp.approved_leaves_count || 0} Approved
                          </span>
                          <span className="badge badge-pending" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                            {emp.pending_leaves_count || 0} Pending
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            disabled={deletingId === emp.id}
                            className="btn btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                            title="Remove Employee"
                          >
                            <Trash2 size={13} /> {deletingId === emp.id ? "Removing..." : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Add New Employee */}
        {isAddModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content animate-fade-in" style={{ maxWidth: "560px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserPlus size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Add New Team Member
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div style={{
                  padding: "10px 14px",
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  marginBottom: "16px"
                }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddEmployee}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. john@company.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select
                    className="form-select"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Product & UI/UX Design">Product & UI/UX Design</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing & Operations">Marketing & Operations</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Initial Login Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Set temporary password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>🌴 Casual Quota</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.casual_quota}
                      onChange={e => setFormData({ ...formData, casual_quota: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>🏥 Medical Quota</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.medical_quota}
                      onChange={e => setFormData({ ...formData, medical_quota: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>💰 Paid Quota</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.paid_quota}
                      onChange={e => setFormData({ ...formData, paid_quota: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitLoading}
                  >
                    {submitLoading ? "Creating..." : "Save & Register Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
