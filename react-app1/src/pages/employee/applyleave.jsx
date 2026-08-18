import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { useNavigate } from "react-router-dom";
import { Send, Calendar, AlertCircle, CheckCircle2, Clock, Info } from "lucide-react";

export default function ApplyLeave() {
  const navigate = useNavigate();

  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = userObj.id || 1;

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api.get(`/leave/balances/${employeeId}`)
      .then(res => {
        if (res.data && res.data.balances) {
          setBalances(res.data.balances);
        }
      })
      .catch(err => console.error("Error loading balances:", err));
  }, [employeeId]);

  // Calculate requested days duration
  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const daysCount = calculateDays();
  const currentQuota = balances && balances[leaveType] ? balances[leaveType] : null;
  const isOverQuota = currentQuota && daysCount > currentQuota.remaining;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fromDate || !toDate || !reason.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      setErrorMsg("To Date cannot be earlier than From Date.");
      return;
    }

    if (isOverQuota) {
      const confirmExceed = window.confirm(
        `Warning: You requested ${daysCount} day(s), but only have ${currentQuota.remaining} day(s) remaining for ${leaveType}. Do you still want to proceed?`
      );
      if (!confirmExceed) return;
    }

    setLoading(true);

    try {
      const res = await api.post("/leave/apply", {
        employee_id: employeeId,
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim()
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/employee/my-leaves");
        }, 1200);
      } else {
        setErrorMsg(res.data.error || "Failed to submit leave application.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Error submitting leave request. Please check backend server.");
    } finally {
      setLoading(false);
    }
  };

  const links = [
    { name: "Dashboard", path: "/employee/dashboard", action: () => navigate("/employee/dashboard") },
    { name: "Apply Leave", path: "/employee/apply", action: () => navigate("/employee/apply") },
    { name: "My Leaves", path: "/employee/my-leaves", action: () => navigate("/employee/my-leaves") }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar links={links} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Apply for Leave" />

        <div style={{ padding: "32px", maxWidth: "740px" }}>
          {success && (
            <div style={{
              padding: "16px 20px",
              background: "var(--success-bg)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "var(--radius-md)",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px"
            }}>
              <CheckCircle2 size={24} />
              <div>
                <h4 style={{ fontWeight: 700 }}>Application Submitted Successfully!</h4>
                <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>Redirecting to your leave history...</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{
              padding: "14px 18px",
              background: "var(--danger-bg)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "0.875rem",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <AlertCircle size={20} />
              {errorMsg}
            </div>
          )}

          <div className="glass-card">
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                New Leave Application Form
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Select leave category and dates. The system evaluates workload overlap prior to manager approval.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label>Leave Category</label>
                  {currentQuota && (
                    <span style={{ fontSize: "0.78rem", color: currentQuota.remaining <= 2 ? "var(--danger)" : "var(--primary)", fontWeight: 600 }}>
                      Quota Remaining: {currentQuota.remaining} / {currentQuota.quota} Days
                    </span>
                  )}
                </div>
                <select
                  className="form-select"
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                >
                  <option value="Casual Leave">🌴 Casual Leave</option>
                  <option value="Medical Leave">🏥 Medical Leave</option>
                  <option value="Paid Leave">💰 Paid Annual Leave</option>
                  <option value="Emergency Leave">🚨 Emergency Leave</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    min={todayStr}
                    value={fromDate}
                    onChange={e => {
                      setFromDate(e.target.value);
                      if (toDate && e.target.value > toDate) {
                        setToDate(e.target.value);
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    min={fromDate || todayStr}
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {daysCount > 0 && (
                <div style={{
                  padding: "12px 16px",
                  background: isOverQuota ? "rgba(239, 68, 68, 0.12)" : "var(--primary-light)",
                  border: isOverQuota ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: "var(--radius-md)",
                  color: isOverQuota ? "var(--danger)" : "var(--primary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={16} /> Total Duration: <strong>{daysCount} Day(s)</strong>
                  </span>
                  {isOverQuota && (
                    <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>
                      ⚠️ Exceeds your balance ({currentQuota.remaining} left)
                    </span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Reason for Leave</label>
                <textarea
                  rows="4"
                  className="form-textarea"
                  placeholder="Provide brief details or context for your manager..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1, padding: "12px" }}
                >
                  <Send size={18} /> {loading ? "Submitting..." : "Submit Leave Request"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/employee/dashboard")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
