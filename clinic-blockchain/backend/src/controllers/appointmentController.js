// backend/src/controllers/appointmentController.js
const pool = require("../config/db");

// ── GET /api/appointments/doctors ─────────────────────────────
// Returns all doctors (for patient to pick from when booking)
const getDoctors = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.doctor_id, d.specialization, d.department, u.name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      ORDER BY u.name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("getDoctors error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/appointments ─────────────────────────────────────
// Patient books an appointment
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, scheduledAt, notes } = req.body;

    if (!doctorId || !scheduledAt) {
      return res.status(400).json({ error: "doctorId and scheduledAt are required" });
    }

    // Get patient_id from logged-in user
    const [patientRows] = await pool.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [req.user.userId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const patientId = patientRows[0].patient_id;

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, notes)
       VALUES (?, ?, ?, 'PENDING', ?)`,
      [patientId, doctorId, new Date(scheduledAt), notes || null]
    );

    // Fetch the full appointment to return it
    const [rows] = await pool.query(`
      SELECT a.*, u.name as doctor_name, d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN users u ON d.user_id = u.user_id
      WHERE a.appointment_id = LAST_INSERT_ID()
    `);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("bookAppointment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/appointments/mine ─────────────────────────────────
// Patient sees their own appointments
const getMyAppointments = async (req, res) => {
  try {
    const [patientRows] = await pool.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [req.user.userId]
    );

    if (patientRows.length === 0) {
      return res.json([]); // no patient profile yet
    }

    const [rows] = await pool.query(`
      SELECT a.*, u.name as doctor_name, d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN users u ON d.user_id = u.user_id
      WHERE a.patient_id = ?
      ORDER BY a.scheduled_at DESC
    `, [patientRows[0].patient_id]);

    res.json(rows);
  } catch (err) {
    console.error("getMyAppointments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/appointments/doctor ──────────────────────────────
// Doctor sees all their appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const [doctorRows] = await pool.query(
      "SELECT doctor_id FROM doctors WHERE user_id = ?",
      [req.user.userId]
    );

    if (doctorRows.length === 0) {
      return res.json([]);
    }

    const [rows] = await pool.query(`
      SELECT a.*, u.name as patient_name, p.blood_type
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u ON p.user_id = u.user_id
      WHERE a.doctor_id = ?
      ORDER BY a.scheduled_at ASC
    `, [doctorRows[0].doctor_id]);

    res.json(rows);
  } catch (err) {
    console.error("getDoctorAppointments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/appointments/:id ───────────────────────────────
// Doctor confirms or cancels an appointment
const updateAppointment = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["CONFIRMED", "DONE", "CANCELLED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    await pool.query(
      "UPDATE appointments SET status = ? WHERE appointment_id = ?",
      [status, req.params.id]
    );

    res.json({ success: true, status });
  } catch (err) {
    console.error("updateAppointment error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDoctors,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointment,
};
