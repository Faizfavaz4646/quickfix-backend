const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user in request" });
    }

    console.log("roleAuth check:", {
      userRole: req.user.role,
      allowedRoles,
    }); // DEBUG: see in terminal

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
        yourRole: req.user.role,
        allowedRoles: allowedRoles,
      });
    }

    next();
  };
};

module.exports = roleAuth;
