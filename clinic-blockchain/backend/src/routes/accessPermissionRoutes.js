// backend/src/routes/accessPermissionRoutes.js
const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getMyPermissions, grantAccess, revokeAccess } = require("../controllers/accessPermissionController");

// GET  /api/access-permissions/mine    — patient sees active permissions
router.get("/mine", authMiddleware, roleMiddleware("PATIENT"), getMyPermissions);

// POST /api/access-permissions/grant   — patient grants a doctor access
router.post("/grant", authMiddleware, roleMiddleware("PATIENT"), grantAccess);

// POST /api/access-permissions/revoke  — patient revokes a doctor's access
router.post("/revoke", authMiddleware, roleMiddleware("PATIENT"), revokeAccess);

module.exports = router;
