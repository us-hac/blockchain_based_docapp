// backend/src/controllers/recordController.js
const db                 = require("../config/db");
const blockchainService  = require("../services/blockchainService");
const crypto             = require("crypto");

// ── POST /api/records — Add a new medical record ─────────────
async function addRecord(req, res) {
  const { patientId, diagnosis, prescription } = req.body;
  const doctorUserId = req.user.userId;

  if (!patientId || !diagnosis) {
    return res.status(400).json({ error: "patientId and diagnosis are required" });
  }

  try {
    // Get doctor row from doctors table
    const [doctorRows] = await db.query(
      "SELECT doctor_id FROM doctors WHERE user_id = ?", [doctorUserId]
    );
    if (doctorRows.length === 0) {
      return res.status(403).json({ error: "Doctor profile not found" });
    }
    const doctorId = doctorRows[0].doctor_id;

    // Insert record into MySQL (tx_hash and data_hash filled after blockchain call)
    const recordId = crypto.randomUUID();
    await db.query(
      `INSERT INTO medical_records
         (record_id, patient_id, doctor_id, diagnosis, prescription)
       VALUES (?, ?, ?, ?, ?)`,
      [recordId, patientId, doctorId, diagnosis, prescription || null]
    );

    // Fetch the saved record to hash it
    const [savedRows] = await db.query(
      "SELECT * FROM medical_records WHERE record_id = ?", [recordId]
    );
    const savedRecord = savedRows[0];

    // Compute SHA-256 hash of the record
    const dataHash = blockchainService.hashRecord(savedRecord);

    // Convert patientId string to a numeric hash for the smart contract
    const patientNumericId = BigInt("0x" + crypto
      .createHash("sha256")
      .update(patientId)
      .digest("hex")
      .slice(0, 16)
    );

    // Write hash to blockchain
    const txHash = await blockchainService.writeRecordHash(
      patientNumericId,
      dataHash
    );

    // Log the action on-chain
    await blockchainService.logAction(
      patientNumericId,
      req.user.walletAddress || "0x0000000000000000000000000000000000000000",
      "ADD_RECORD"
    );

    // Update record row with data_hash and tx_hash
    await db.query(
      "UPDATE medical_records SET data_hash = ?, tx_hash = ? WHERE record_id = ?",
      [dataHash, txHash, recordId]
    );

    return res.status(201).json({
      message:   "Record saved and anchored on-chain",
      recordId,
      dataHash,
      txHash,
    });
  } catch (err) {
    console.error("addRecord error:", err);
    return res.status(500).json({ error: "Failed to save record" });
  }
}

// ── GET /api/records/mine — Patient sees their own records ────
async function getMyRecords(req, res) {
  try {
    // Get patient_id from logged-in user
    const [patientRows] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [req.user.userId]
    );

    if (patientRows.length === 0) {
      return res.json([]);
    }

    const [rows] = await db.query(
      `SELECT mr.*, d.specialization AS doctor_specialization, u.name AS doctor_name
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.doctor_id
       JOIN users   u ON d.user_id    = u.user_id
       WHERE mr.patient_id = ?
       ORDER BY mr.created_at DESC`,
      [patientRows[0].patient_id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyRecords error:", err);
    return res.status(500).json({ error: "Failed to fetch records" });
  }
}

// ── GET /api/records/patient/:patientId — Get all records ─────
async function getRecords(req, res) {
  const { patientId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT mr.*, d.specialization, u.name AS doctor_name
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.doctor_id
       JOIN users   u ON d.user_id    = u.user_id
       WHERE mr.patient_id = ?
       ORDER BY mr.created_at DESC`,
      [patientId]
    );

    return res.json({ records: rows });
  } catch (err) {
    console.error("getRecords error:", err);
    return res.status(500).json({ error: "Failed to fetch records" });
  }
}

// ── GET /api/records/:recordId/verify — Verify integrity ──────
async function verifyRecord(req, res) {
  const { recordId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM medical_records WHERE record_id = ?", [recordId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const record   = rows[0];
    const { data_hash, patient_id } = record;

    if (!data_hash) {
      return res.json({ verified: false, reason: "No hash stored for this record" });
    }

    const recomputed = blockchainService.hashRecord(record);

    const patientNumericId = BigInt("0x" + crypto
      .createHash("sha256")
      .update(patient_id)
      .digest("hex")
      .slice(0, 16)
    );

    const onChain = await blockchainService.verifyRecordHash(
      patientNumericId,
      data_hash
    );

    const tampered = recomputed !== data_hash;

    return res.json({
      verified:       onChain && !tampered,
      onChain,
      tampered,
      storedHash:     data_hash,
      recomputedHash: recomputed,
    });
  } catch (err) {
    console.error("verifyRecord error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
}

module.exports = { addRecord, getMyRecords, getRecords, verifyRecord };
