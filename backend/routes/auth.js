const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, authenticateToken } = require("../middleware/auth");

const router = express.Router();

// User Login (Employee or Admin) with Bcrypt & JWT
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Please provide both credentials and password." });
  }

  const table = role === "admin" ? "admins" : "employees";
  const field = role === "admin" ? "username" : "email";

  db.query(
    `SELECT * FROM ${table} WHERE ${field} = ?`,
    [email],
    async (err, results) => {
      if (err) {
        console.error("Login Query Error:", err);
        return res.status(500).json({ success: false, error: "Database query error." });
      }

      if (results.length === 0) {
        return res.json({ success: false, error: "Account not found with provided credentials." });
      }

      const user = results[0];
      let isMatch = false;

      // Check if password in DB is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      const isBcrypt = user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$"));

      if (isBcrypt) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text fallback with automated seamless upgrade to bcrypt
        isMatch = user.password === password;
        if (isMatch) {
          const newHash = await bcrypt.hash(password, 10);
          db.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [newHash, user.id]);
        }
      }

      if (!isMatch) {
        return res.json({ success: false, error: "Invalid password. Please try again." });
      }

      // Generate JWT Token
      const tokenPayload = {
        id: user.id,
        role: role || "employee",
        email: user.email || user.username,
        name: user.name,
        department: user.department || "General"
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

      // Clean up sensitive fields before returning
      const sanitizedUser = { ...user, role: role || "employee" };
      delete sanitizedUser.password;

      return res.json({
        success: true,
        token,
        user: sanitizedUser
      });
    }
  );
});

// Employee Registration Route
router.post("/register", async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const dept = department || "Engineering";

    db.query(
      "INSERT INTO employees (name, email, password, department, casual_quota, medical_quota, paid_quota) VALUES (?, ?, ?, ?, 12, 10, 15)",
      [name, email, hashedPassword, dept],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ success: false, error: "An employee with this email already exists." });
          }
          return res.status(500).json({ success: false, error: err.message });
        }

        const newUser = {
          id: result.insertId,
          name,
          email,
          department: dept,
          role: "employee"
        };

        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: "7d" });

        res.json({
          success: true,
          message: "Registration successful!",
          token,
          user: newUser
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to process registration." });
  }
});

// Get Current Logged-in Profile
router.get("/me", authenticateToken, (req, res) => {
  const { id, role } = req.user;
  const table = role === "admin" ? "admins" : "employees";

  db.query(`SELECT id, name, ${role === 'admin' ? 'username' : 'email, department, casual_quota, medical_quota, paid_quota'} FROM ${table} WHERE id = ?`, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    res.json({ success: true, user: { ...results[0], role } });
  });
});

module.exports = router;
