// backend/src/app.js - FIXED
const express        = require("express");
const cors           = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Fallback — hardcode if dotenv fails (dotenv v17 issue)
process.env.DB_HOST     = process.env.DB_HOST     || "localhost";
process.env.DB_PORT     = process.env.DB_PORT     || "3306";
process.env.DB_USER     = process.env.DB_USER     || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "1505";
process.env.DB_NAME     = process.env.DB_NAME     || "clinic_db";
process.env.JWT_SECRET  = process.env.JWT_SECRET  || "clinicapp_super_secret_2026";
process.env.PORT        = process.env.PORT        || "5000";
process.env.NODE_ENV    = process.env.NODE_ENV    || "development";

// ── Import configs (connect DB + blockchain on startup) ───────
require("./config/db");
require("./config/blockchain");

// ── Import middleware ─────────────────────────────────────────
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

// ── Import controllers ────────────────────────────────────────
const { register, login }                                   = require("./controllers/authController");
const { addRecord, getMyRecords, getRecords, verifyRecord } = require("./controllers/recordController");

const app = express();

// ── CORS (MUST be the very first middleware) ──────────────────
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));   // ✅ handle ALL preflight requests

// ── Body parser ───────────────────────────────────────────────
app.use(express.json());

// ── Health check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Clinic API is running ✅", version: "1.0.0" });
});

// ── Auth routes (public) ──────────────────────────────────────
app.post("/api/auth/register", register);
app.post("/api/auth/login",    login);

// ── Record routes (protected) ─────────────────────────────────
// ⚠️  ORDER MATTERS: /mine and /patient/:id must come BEFORE /:recordId/verify
//     otherwise Express matches "mine" as a recordId param

app.post(
  "/api/records",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  addRecord
);

// Patient views their own records
app.get(
  "/api/records/mine",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getMyRecords
);

// Doctor / Admin views records for a specific patient
app.get(
  "/api/records/patient/:patientId",
  authMiddleware,
  roleMiddleware("DOCTOR", "PATIENT", "ADMIN"),
  getRecords
);

// Anyone authenticated can verify a record's integrity
app.get(
  "/api/records/:recordId/verify",
  authMiddleware,
  verifyRecord
);

// ── Admin routes (protected) ──────────────────────────────────
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ── Appointment routes ────────────────────────────────────────
const appointmentRoutes = require("./routes/appointmentRoutes");
app.use("/api/appointments", appointmentRoutes);

// ── Patient routes ────────────────────────────────────────────
const patientRoutes = require("./routes/patientRoutes");
app.use("/api/patients", patientRoutes);

// ── Access permission routes ──────────────────────────────────
const accessPermissionRoutes = require("./routes/accessPermissionRoutes");
app.use("/api/access-permissions", accessPermissionRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Clinic API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Press Ctrl+C to stop\n`);
});

module.exports = app;