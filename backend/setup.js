require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || ""
    });

    console.log("Connected to MySQL server.");

    // Create database if not exists
    await connection.query("CREATE DATABASE IF NOT EXISTS student_db");
    console.log("Database 'student_db' ensured.");

    await connection.query("USE student_db");

    // 1. Create employees table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        department VARCHAR(100) DEFAULT 'Engineering',
        casual_quota INT DEFAULT 12,
        medical_quota INT DEFAULT 10,
        paid_quota INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Helper to safely add column if it doesn't exist
    const addColumnIfNotExists = async (table, column, definition) => {
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'student_db' AND TABLE_NAME = ? AND COLUMN_NAME = ?
      `, [table, column]);

      if (columns.length === 0) {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added column '${column}' to table '${table}'`);
      }
    };

    // Safe column migrations for employees
    await addColumnIfNotExists("employees", "department", "VARCHAR(100) DEFAULT 'Engineering'");
    await addColumnIfNotExists("employees", "casual_quota", "INT DEFAULT 12");
    await addColumnIfNotExists("employees", "medical_quota", "INT DEFAULT 10");
    await addColumnIfNotExists("employees", "paid_quota", "INT DEFAULT 15");

    // 2. Create admins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create leaves table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type VARCHAR(50),
        from_date DATE,
        to_date DATE,
        reason TEXT,
        status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
        admin_remark TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Safe column & enum migrations for leaves
    await addColumnIfNotExists("leaves", "admin_remark", "TEXT NULL");
    try {
      await connection.query("ALTER TABLE leaves MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending'");
    } catch (e) {}

    // 4. Seed / Update test credentials with Bcrypt
    const saltRounds = 10;
    const hashedEmpPassword = await bcrypt.hash("123456", saltRounds);
    const hashedAdminPassword = await bcrypt.hash("admin123", saltRounds);

    await connection.query(`
      INSERT INTO employees (email, password, name, department, casual_quota, medical_quota, paid_quota) 
      VALUES (?, ?, ?, ?, 12, 10, 15)
      ON DUPLICATE KEY UPDATE 
        password = VALUES(password), 
        name = VALUES(name),
        department = VALUES(department)
    `, ["monishprakash45@gmail.com", hashedEmpPassword, "Monish Prakash", "Software Engineering"]);

    await connection.query(`
      INSERT INTO admins (username, password, name) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        password = VALUES(password), 
        name = VALUES(name)
    `, ["admin", hashedAdminPassword, "Admin Manager"]);

    console.log("\n✅ Database setup, migrations, and bcrypt encryption completed successfully!");
    console.log("\nSecured Test Credentials:");
    console.log("Employee - Email: monishprakash45@gmail.com | Password: 123456");
    console.log("Admin    - Username: admin | Password: admin123\n");

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Database Setup Error:", error);
    process.exit(1);
  }
}

setupDatabase();
