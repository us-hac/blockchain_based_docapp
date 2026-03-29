// backend/src/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const db     = require("../config/db");

// ── Register ─────────────────────────────────────────────────
async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const allowedRoles = ["PATIENT", "DOCTOR", "ADMIN"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE email = ?", [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId       = require("crypto").randomUUID();

    await db.query(
      "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [userId, name, email, passwordHash, role]
    );

    // If patient, create patients row
    if (role === "PATIENT") {
      const { dateOfBirth, bloodType, contactInfo, insuranceNo } = req.body;
      await db.query(
        "INSERT INTO patients (patient_id, user_id, date_of_birth, blood_type, contact_info, insurance_no) VALUES (?, ?, ?, ?, ?, ?)",
        [require("crypto").randomUUID(), userId, dateOfBirth || null, bloodType || null, contactInfo || null, insuranceNo || null]
      );
    }

    // If doctor, create doctors row
    if (role === "DOCTOR") {
      const { specialization, licenseNo, department } = req.body;
      if (!licenseNo) return res.status(400).json({ error: "License number required for doctors" });
      await db.query(
        "INSERT INTO doctors (doctor_id, user_id, specialization, license_no, department) VALUES (?, ?, ?, ?, ?)",
        [require("crypto").randomUUID(), userId, specialization || null, licenseNo, department || null]
      );
    }

    return res.status(201).json({ message: "User registered successfully", userId });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
}

// ── Login ─────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?", [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        userId:    user.user_id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
}

module.exports = { register, login };
