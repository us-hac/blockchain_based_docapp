// backend/src/middleware/roleMiddleware.js

/**
 * Factory that returns a middleware allowing only the specified roles.
 * Usage: router.get("/admin", authMiddleware, roleMiddleware("ADMIN"), handler)
 *        router.get("/records", authMiddleware, roleMiddleware("DOCTOR","ADMIN"), handler)
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
