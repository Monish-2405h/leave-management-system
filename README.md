# 🏢 LeaveAI — Enterprise Leave Management System

A full-stack intelligent leave management system with **AI workload overlap detection**, **JWT-secured authentication**, **leave quota tracking**, and **data analytics dashboard**.

> 🎓 Built as a B.Tech AI & Data Science 3rd Year Mini Project

---

## ✨ Features

### Employee Portal
- 🔐 Secure login with **bcrypt + JWT authentication**
- 📊 **Annual leave quota & balance tracker** (Casual, Medical, Paid)
- 📝 Apply for leave with **real-time quota validation** and date constraints
- ❌ Cancel pending leave requests
- 💬 View **manager remarks** and approval/rejection feedback

### Admin / Manager Portal
- 📈 **Analytics Dashboard** with AI risk alerts, approval rates, and leave type breakdown
- 🤖 **AI Workload Overlap Risk Engine** — auto-flags scheduling conflicts
- 🔍 **AI Conflict Inspector Modal** — shows which employees overlap on specific dates
- ✅ Approve / Reject requests with mandatory manager remarks
- 📅 **Team Absence Calendar** — monthly visual heatmap of team coverage
- 👥 **Employee Directory** — add, view, and manage team members & custom leave quotas
- 📥 **1-Click CSV Report Export** for HR/Payroll

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + Lucide Icons |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL (mysql2 pool) |
| **Auth** | bcryptjs + JWT (jsonwebtoken) |
| **Styling** | Vanilla CSS + Google Fonts |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16+
- [MySQL Server](https://dev.mysql.com/downloads/) (XAMPP / MySQL Workbench)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/leave-management-system.git
cd leave-management-system
```

---

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Open `.env` and fill in your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_db
JWT_SECRET=your_long_random_secret_key
```

Run the database setup script (creates tables + seeds test users):
```bash
node setup.js
```

Start the backend server:
```bash
npm run dev
```
> Backend runs at: `http://localhost:5000`

---

### Step 3: Frontend Setup

```bash
cd react-app1
npm install
npm run dev
```
> Frontend runs at: `http://localhost:5173`

---

## 🔑 Default Test Credentials

| Role | Username / Email | Password |
|---|---|---|
| **Employee** | `monishprakash45@gmail.com` | `123456` |
| **Admin / Manager** | `admin` | `admin123` |

> Passwords are stored using **bcrypt hashing**. Run `node setup.js` to reset/seed these accounts.

---

## 📁 Project Structure

```
leave_management/
├── backend/                    # Node.js + Express + MySQL
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Login, register (bcrypt + JWT)
│   │   ├── leave.js            # Leave CRUD, AI overlap engine, CSV export
│   │   └── employee.js         # Employee directory management
│   ├── db.js                   # MySQL connection pool
│   ├── setup.js                # Database migration & seed script
│   ├── index.js                # Express server entry point
│   └── .env.example            # ← Copy to .env and fill credentials
│
└── react-app1/                 # React 19 + Vite frontend
    └── src/
        ├── pages/
        │   ├── login.jsx
        │   ├── admin/
        │   │   ├── admindashboard.jsx
        │   │   ├── manageleave.jsx
        │   │   ├── calendarview.jsx
        │   │   └── employeemanagement.jsx
        │   └── employee/
        │       ├── employeedashboard.jsx
        │       ├── applyleave.jsx
        │       └── myleaves.jsx
        ├── components/
        └── services/api.js     # Axios + JWT interceptor
```

---

## 🤖 How AI Risk Level Works

The **AI Overlap Engine** runs server-side on every admin request:

| Overlapping Absences | Risk Level | Score |
|---|---|---|
| 0 other employees absent | 🟢 **Low** | 15% |
| 1 employee absent on same dates | 🟡 **Medium** | 50% |
| 2+ employees absent on same dates | 🔴 **High** | 85% |

Plus **NLP keyword classification** of leave reasons into:
- `Medical Emergency` (fever, hospital, sick...)
- `Vacation & Travel` (trip, wedding, holiday...)
- `Urgent Personal` (family, emergency...)
- `General Request` (default)

---

## 📄 License

ISC — Open for educational and academic use.
