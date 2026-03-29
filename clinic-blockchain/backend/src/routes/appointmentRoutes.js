// backend/src/routes/appointmentRoutes.js
const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getDoctors,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointment,
} = require("../controllers/appointmentController");

// GET  /api/appointments/doctors  — list all doctors (patient uses this to pick)
router.get("/doctors", authMiddleware, getDoctors);

// GET  /api/appointments/mine     — patient sees their own appointments
router.get("/mine", authMiddleware, roleMiddleware("PATIENT"), getMyAppointments);

// POST /api/appointments           — patient books an appointment
router.post("/", authMiddleware, roleMiddleware("PATIENT"), bookAppointment);

// GET  /api/appointments/doctor   — doctor sees their schedule
router.get("/doctor", authMiddleware, roleMiddleware("DOCTOR"), getDoctorAppointments);

// PATCH /api/appointments/:id     — doctor confirms / marks done / cancels
router.patch("/:id", authMiddleware, roleMiddleware("DOCTOR", "ADMIN"), updateAppointment);

module.exports = router;
