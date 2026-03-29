const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET /api/admin/users
router.get("/users", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, email, role, created_at, active FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id  — toggle active status (enable / disable account)
router.patch("/users/:id", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    const { active } = req.body;
    await pool.query(
      "UPDATE users SET active = ? WHERE user_id = ?",
      [active ? 1 : 0, req.params.id]   // ✅ convert boolean to 1/0
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Toggle user error:", err); // ✅ log the real error
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get("/audit-logs", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.name as user_name 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.logged_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;