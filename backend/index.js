const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leave");
const employeeRoutes = require("./routes/employee");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/employees", employeeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
