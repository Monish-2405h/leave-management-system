import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/login";
import AdminDashboard from "./pages/admin/admindashboard";
import ManageLeave from "./pages/admin/manageleave";
import CalendarView from "./pages/admin/calendarview";
import EmployeeManagement from "./pages/admin/employeemanagement";
import EmployeeDashboard from "./pages/employee/employeedashboard";
import ApplyLeave from "./pages/employee/applyleave";
import MyLeaves from "./pages/employee/myleaves";
import ProtectedRoute from "./components/protectedroute";

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage" element={
          <ProtectedRoute role="admin">
            <ManageLeave />
          </ProtectedRoute>
        } />
        <Route path="/admin/calendar" element={
          <ProtectedRoute role="admin">
            <CalendarView />
          </ProtectedRoute>
        } />
        <Route path="/admin/employees" element={
          <ProtectedRoute role="admin">
            <EmployeeManagement />
          </ProtectedRoute>
        } />

        {/* Employee Routes */}
        <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/employee/dashboard" element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employee/apply" element={
          <ProtectedRoute role="employee">
            <ApplyLeave user={user} />
          </ProtectedRoute>
        } />
        <Route path="/employee/my-leaves" element={
          <ProtectedRoute role="employee">
            <MyLeaves user={user} />
          </ProtectedRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
