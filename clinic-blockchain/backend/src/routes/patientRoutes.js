// backend/src/routes/patientRoutes.js
const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getMyPatients, getAllPatients } = require("../controllers/patientController");

// GET /api/patients
// Doctor gets only patients who granted them access
router.get("/", authMiddleware, roleMiddleware("DOCTOR"), getMyPatients);

// GET /api/patients/all
// Admin gets every patient in the system
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllPatients);

module.exports = router;
