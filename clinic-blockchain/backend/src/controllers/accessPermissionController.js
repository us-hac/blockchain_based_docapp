// backend/src/controllers/accessPermissionController.js
const pool = require("../config/db");

// ── GET /api/access-permissions/mine ──────────────────────────
// Patient sees which doctors currently have access to their records
const getMyPermissions = async (req, res) => {
  try {
    const [patientRows] = await pool.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [req.user.userId]
    );

    if (patientRows.length === 0) {
      return res.json([]);
    }

    const [rows] = await pool.query(`
      SELECT 
        ap.permission_id,
        ap.doctor_id,
        ap.granted_at,
        ap.tx_hash,
        u.name as doctor_name,
        d.specialization
      FROM access_permissions ap
      JOIN doctors d ON ap.doctor_id = d.doctor_id
      JOIN users u ON d.user_id = u.user_id
      WHERE ap.patient_id = ?
        AND ap.revoked_at IS NULL
      ORDER BY ap.granted_at DESC
    `, [patientRows[0].patient_id]);

    res.json(rows);
  } catch (err) {
    console.error("getMyPermissions error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/access-permissions/grant ────────────────────────
// Patient grants a doctor access
const grantAccess = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ error: "doctorId is required" });

    const [patientRows] = await pool.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [req.user.userId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const patientId = patientRows[0].patient_id;

    // Check if already active
    const [existing] = await pool.query(
      "SELECT permission_id FROM access_permissions WHERE patient_id = ? AND doctor_id = ? AND revoked_at IS NULL",
      [patientId, doctorId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Access already granted" });
    }

    await pool.query(
      "INSERT INTO access_permissions (patient_id, doctor_id, granted_at) VALUES (?, ?, NOW())",
      [patientId, doctorId]
    );

    res.status(201).json({ success: true, message: "Access granted" });
  } catch (err) {
    console.error("grantAccess error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/access-permissions/revoke ───────────────────────
// Patient revokes a doctor's access
const revokeAccess = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ error: "doctorId is required" });

    const [patientRows] = await pool.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [req.user.userId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    await pool.query(
      "UPDATE access_permissions SET revoked_at = NOW() WHERE patient_id = ? AND doctor_id = ? AND revoked_at IS NULL",
      [patientRows[0].patient_id, doctorId]
    );

    res.json({ success: true, message: "Access revoked" });
  } catch (err) {
    console.error("revokeAccess error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyPermissions, grantAccess, revokeAccess };
