const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Get all employees with their department and leave quota statistics (Admin only or authenticated)
router.get("/", authenticateToken, (req, res) => {
  const query = `
    SELECT 
      e.id, 
      e.name, 
      e.email, 
      e.department, 
      e.casual_quota, 
      e.medical_quota, 
      e.paid_quota, 
      e.created_at,
      COUNT(CASE WHEN l.status = 'Approved' THEN 1 END) as approved_leaves_count,
      COUNT(CASE WHEN l.status = 'Pending' THEN 1 END) as pending_leaves_count
    FROM employees e
    LEFT JOIN leaves l ON e.id = l.employee_id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching employees:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, employees: results });
  });
});

// Admin Add New Employee
router.post("/", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const { name, email, password, department, casual_quota, medical_quota, paid_quota } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and initial password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const dept = department || "Engineering";
    const cQuota = parseInt(casual_quota, 10) || 12;
    const mQuota = parseInt(medical_quota, 10) || 10;
    const pQuota = parseInt(paid_quota, 10) || 15;

    db.query(
      "INSERT INTO employees (name, email, password, department, casual_quota, medical_quota, paid_quota) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, dept, cQuota, mQuota, pQuota],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ success: false, error: "An employee with this email already exists." });
          }
          return res.status(500).json({ success: false, error: err.message });
        }

        res.json({
          success: true,
          message: "Employee registered successfully!",
          employeeId: result.insertId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error creating employee." });
  }
});

// Admin Delete Employee
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const employeeId = req.params.id;

  db.query("DELETE FROM employees WHERE id = ?", [employeeId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Employee not found." });
    }
    res.json({ success: true, message: "Employee removed successfully." });
  });
});

module.exports = router;
