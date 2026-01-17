const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded._id || !decoded.role) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // attach all relevant info to req.user
    req.user = {
      _id: decoded._id,
      role: decoded.role,
      emailId: decoded.emailId, // optional, helpful for debugging
      name: decoded.name,       // optional
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Token expired or invalid" });
  }
};

module.exports = userAuth;
