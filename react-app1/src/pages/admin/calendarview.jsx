import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Clock, Sparkles } from "lucide-react";

export default function CalendarView() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    api.get("/leave/calendar")
      .then(res => {
        setLeaves(res.data?.calendarLeaves || []);
      })
      .catch(err => console.error("Error loading calendar data:", err))
      .finally(() => setLoading(false));
  }, []);

  const links = [
    { name: "Analytics Dashboard", path: "/admin/dashboard", action: () => navigate("/admin/dashboard") },
    { name: "Manage Leaves", path: "/admin/manage", action: () => navigate("/admin/manage") },
    { name: "Absence Calendar", path: "/admin/calendar", action: () => navigate("/admin/calendar") },
    { name: "Employee Directory", path: "/admin/employees", action: () => navigate("/admin/employees") }
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Find absences on a particular day
  const getAbsencesForDay = (day) => {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    return leaves.filter(l => {
      const from = new Date(l.from_date);
      from.setHours(0, 0, 0, 0);
      const to = new Date(l.to_date);
      to.setHours(23, 59, 59, 999);

      return targetDate >= from && targetDate <= to;
    });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar links={links} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Team Absence Calendar" />

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Monthly Absence Heatmap & Schedule
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Visual timeline showing team coverage and concurrent employee leaves.
              </p>
            </div>

            {/* Month Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                <ChevronLeft size={16} />
              </button>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, minWidth: "160px", textAlign: "center", color: "var(--text-primary)" }}>
                {monthNames[month]} {year}
              </h3>
              <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid Card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            {/* Days of Week Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "8px",
              textAlign: "center",
              marginBottom: "12px",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: "var(--text-secondary)"
            }}>
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                <div key={d} style={{ padding: "8px 0" }}>{d}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "8px"
            }}>
              {/* Empty padding cells for preceding month */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: "100px", opacity: 0.2 }} />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const absences = getAbsencesForDay(day);
                const hasHighAbsence = absences.length >= 2;

                return (
                  <div
                    key={`day-${day}`}
                    style={{
                      minHeight: "110px",
                      background: hasHighAbsence ? "rgba(239, 68, 68, 0.08)" : "var(--bg-input)",
                      border: hasHighAbsence ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: hasHighAbsence ? "#F87171" : "var(--text-primary)"
                      }}>
                        {day}
                      </span>
                      {absences.length > 0 && (
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: hasHighAbsence ? "#F87171" : "var(--primary)",
                          background: hasHighAbsence ? "rgba(239, 68, 68, 0.2)" : "var(--primary-light)",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-full)"
                        }}>
                          {absences.length} Away
                        </span>
                      )}
                    </div>

                    {/* Absent Member Badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflowY: "auto", maxHeight: "70px" }}>
                      {absences.map(a => (
                        <div
                          key={a.id}
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "var(--radius-sm)",
                            background: a.status === 'Approved' ? "var(--success-bg)" : "var(--warning-bg)",
                            color: a.status === 'Approved' ? "var(--success)" : "var(--warning)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                          title={`${a.employee_name} (${a.leave_type}) - ${a.status}`}
                        >
                          • {a.employee_name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
