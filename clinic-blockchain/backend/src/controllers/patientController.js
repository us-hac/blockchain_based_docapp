// backend/src/controllers/patientController.js
const pool = require("../config/db");

// ── GET /api/patients ──────────────────────────────────────────
// Returns all patients who have granted access to the logged-in doctor
const getMyPatients = async (req, res) => {
  try {
    // Get doctor_id from logged-in user
    const [doctorRows] = await pool.query(
      "SELECT doctor_id FROM doctors WHERE user_id = ?",
      [req.user.userId]
    );

    if (doctorRows.length === 0) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorRows[0].doctor_id;

    // Get all patients who granted access to this doctor
    // (revoked_at IS NULL means access is still active)
    const [rows] = await pool.query(`
      SELECT 
        p.patient_id,
        p.date_of_birth,
        p.blood_type,
        p.contact_info,
        p.insurance_no,
        u.name,
        u.email
      FROM access_permissions ap
      JOIN patients p ON ap.patient_id = p.patient_id
      JOIN users u ON p.user_id = u.user_id
      WHERE ap.doctor_id = ?
        AND ap.revoked_at IS NULL
      ORDER BY u.name ASC
    `, [doctorId]);

    res.json(rows);
  } catch (err) {
    console.error("getMyPatients error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/patients/all ──────────────────────────────────────
// Admin only — returns every patient in the system
const getAllPatients = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.patient_id,
        p.date_of_birth,
        p.blood_type,
        p.contact_info,
        p.insurance_no,
        u.name,
        u.email
      FROM patients p
      JOIN users u ON p.user_id = u.user_id
      ORDER BY u.name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("getAllPatients error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyPatients, getAllPatients };
