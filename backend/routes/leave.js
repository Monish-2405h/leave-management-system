const express = require("express");
const db = require("../db");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Helper to calculate days between two dates inclusive
const getDaysBetween = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
};

// 1. Fetch Leave Balances & Quotas for an Employee
router.get("/balances/:employeeId", authenticateToken, (req, res) => {
  const employeeId = req.params.employeeId;

  const empQuery = "SELECT id, name, casual_quota, medical_quota, paid_quota FROM employees WHERE id = ?";
  const leavesQuery = "SELECT leave_type, from_date, to_date, status FROM leaves WHERE employee_id = ? AND status = 'Approved'";

  db.query(empQuery, [employeeId], (err, empResults) => {
    if (err || empResults.length === 0) {
      return res.status(404).json({ success: false, error: "Employee record not found." });
    }

    const employee = empResults[0];
    const quotas = {
      "Casual Leave": employee.casual_quota || 12,
      "Medical Leave": employee.medical_quota || 10,
      "Paid Leave": employee.paid_quota || 15,
      "Emergency Leave": 5
    };

    db.query(leavesQuery, [employeeId], (err2, leaveResults) => {
      if (err2) {
        return res.status(500).json({ success: false, error: err2.message });
      }

      const used = {
        "Casual Leave": 0,
        "Medical Leave": 0,
        "Paid Leave": 0,
        "Emergency Leave": 0
      };

      (leaveResults || []).forEach(l => {
        const type = l.leave_type;
        const days = getDaysBetween(l.from_date, l.to_date);
        if (used[type] !== undefined) {
          used[type] += days;
        } else {
          used[type] = days;
        }
      });

      const balances = {};
      Object.keys(quotas).forEach(type => {
        const quotaVal = quotas[type];
        const usedVal = used[type] || 0;
        balances[type] = {
          quota: quotaVal,
          used: usedVal,
          remaining: Math.max(0, quotaVal - usedVal)
        };
      });

      res.json({
        success: true,
        employee: { id: employee.id, name: employee.name },
        balances
      });
    });
  });
});

// 2. Apply for leave with Date & Quota Validation
router.post("/apply", authenticateToken, (req, res) => {
  const { leave_type, from_date, to_date, reason } = req.body;
  const employee_id = req.user.id || req.body.employee_id;

  if (!leave_type || !from_date || !to_date || !reason) {
    return res.status(400).json({ success: false, error: "All fields (leave type, dates, reason) are required." });
  }

  const start = new Date(from_date);
  const end = new Date(to_date);

  if (end < start) {
    return res.status(400).json({ success: false, error: "To Date cannot be earlier than From Date." });
  }

  const requestedDays = getDaysBetween(from_date, to_date);

  db.query(
    "INSERT INTO leaves (employee_id, leave_type, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
    [employee_id, leave_type, from_date, to_date, reason],
    (err, result) => {
      if (err) {
        console.error("Apply Leave Error:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        id: result.insertId,
        message: "Leave application submitted successfully.",
        requestedDays
      });
    }
  );
});

// 3. Fetch leaves for specific employee
router.get("/employee/:id", authenticateToken, (req, res) => {
  db.query(
    "SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

// 4. Cancel a Pending Leave Request (Employee Self-Service)
router.put("/cancel/:id", authenticateToken, (req, res) => {
  const leaveId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Check if leave exists and belongs to employee (or admin)
  db.query("SELECT * FROM leaves WHERE id = ?", [leaveId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, error: "Leave request not found." });
    }

    const leave = results[0];

    if (userRole !== "admin" && leave.employee_id !== userId) {
      return res.status(403).json({ success: false, error: "You can only cancel your own leave requests." });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({ success: false, error: `Cannot cancel a leave that is already ${leave.status}.` });
    }

    db.query(
      "UPDATE leaves SET status = 'Cancelled', admin_remark = 'Cancelled by applicant' WHERE id = ?",
      [leaveId],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ success: false, error: updateErr.message });
        }
        res.json({ success: true, message: "Leave request cancelled successfully." });
      }
    );
  });
});

// 5. Fetch all leaves for Admin with Detailed AI Overlap & Conflict Inspector
router.get("/all", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  db.query(
    `SELECT leaves.*, employees.name, employees.email, employees.department 
     FROM leaves 
     JOIN employees ON leaves.employee_id = employees.id 
     ORDER BY leaves.created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Calculate AI Overlap Risk Score & capture detailed conflict profiles
      const enrichedLeaves = result.map(leave => {
        // Collect all non-rejected leaves that overlap in dates
        const conflictingLeaves = result.filter(other => {
          if (other.id === leave.id) return false;
          if (other.status === 'Rejected' || other.status === 'Cancelled') return false;

          const startA = new Date(leave.from_date);
          const endA = new Date(leave.to_date);
          const startB = new Date(other.from_date);
          const endB = new Date(other.to_date);

          return startA <= endB && startB <= endA;
        });

        let riskLevel = 'Low';
        let riskScore = 15;

        if (conflictingLeaves.length >= 2) {
          riskLevel = 'High';
          riskScore = 85;
        } else if (conflictingLeaves.length === 1) {
          riskLevel = 'Medium';
          riskScore = 50;
        }

        // NLP reason categorization tag
        const reasonLower = (leave.reason || '').toLowerCase();
        let categoryTag = 'General Request';
        if (reasonLower.includes('fever') || reasonLower.includes('doctor') || reasonLower.includes('hospital') || reasonLower.includes('sick') || reasonLower.includes('medical') || reasonLower.includes('surgery')) {
          categoryTag = 'Medical Emergency';
        } else if (reasonLower.includes('vacation') || reasonLower.includes('trip') || reasonLower.includes('travel') || reasonLower.includes('wedding') || reasonLower.includes('holiday') || reasonLower.includes('tour')) {
          categoryTag = 'Vacation & Travel';
        } else if (reasonLower.includes('urgent') || reasonLower.includes('family') || reasonLower.includes('emergency') || reasonLower.includes('personal')) {
          categoryTag = 'Urgent Personal';
        }

        // Map simplified conflict profiles for UI modal inspection
        const conflictDetails = conflictingLeaves.map(c => ({
          id: c.id,
          name: c.name,
          department: c.department || 'Engineering',
          leave_type: c.leave_type,
          from_date: c.from_date,
          to_date: c.to_date,
          status: c.status
        }));

        return {
          ...leave,
          riskLevel,
          riskScore,
          overlappingCount: conflictingLeaves.length,
          conflictDetails,
          categoryTag
        };
      });

      res.json(enrichedLeaves);
    }
  );
});

// 6. Update leave status (Approve / Reject) with Admin Remark
router.put("/update/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const { status, admin_remark } = req.body;

  if (!status || !["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status. Must be 'Approved' or 'Rejected'." });
  }

  const remark = admin_remark || (status === "Approved" ? "Approved by Manager" : "Declined by Manager");

  db.query(
    "UPDATE leaves SET status = ?, admin_remark = ? WHERE id = ?",
    [status, remark, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: `Leave request has been ${status.toLowerCase()}.` });
    }
  );
});

// 7. Calendar View API - returns active absence timeline
router.get("/calendar", authenticateToken, (req, res) => {
  const query = `
    SELECT 
      l.id, 
      l.leave_type, 
      l.from_date, 
      l.to_date, 
      l.reason, 
      l.status, 
      e.name as employee_name, 
      e.department
    FROM leaves l
    JOIN employees e ON l.employee_id = e.id
    WHERE l.status IN ('Approved', 'Pending')
    ORDER BY l.from_date ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, calendarLeaves: results });
  });
});

// 8. Export Leaves to CSV
router.get("/export", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const query = `
    SELECT 
      l.id,
      e.name as employee_name,
      e.email,
      e.department,
      l.leave_type,
      l.from_date,
      l.to_date,
      l.reason,
      l.status,
      l.admin_remark,
      l.created_at
    FROM leaves l
    JOIN employees e ON l.employee_id = e.id
    ORDER BY l.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    // Format as CSV
    const headers = ["Request ID", "Employee Name", "Email", "Department", "Leave Type", "From Date", "To Date", "Reason", "Status", "Manager Remark", "Submitted On"];
    const rows = results.map(r => [
      r.id,
      `"${(r.employee_name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${(r.leave_type || '').replace(/"/g, '""')}"`,
      r.from_date ? new Date(r.from_date).toISOString().split('T')[0] : '',
      r.to_date ? new Date(r.to_date).toISOString().split('T')[0] : '',
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      r.status,
      `"${(r.admin_remark || '').replace(/"/g, '""')}"`,
      r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : ''
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="leave_records_export.csv"');
    res.send(csvContent);
  });
});

// 9. Analytics API Endpoint (Data Science Dashboard Metrics)
router.get("/analytics", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const querySummary = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status='Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM leaves;
  `;

  const queryTypes = `
    SELECT leave_type, COUNT(*) as count 
    FROM leaves 
    GROUP BY leave_type;
  `;

  db.query(querySummary, (err, summaryResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(queryTypes, (err2, typesResult) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        summary: summaryResult[0] || { total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0 },
        byType: typesResult || []
      });
    });
  });
});

module.exports = router;
