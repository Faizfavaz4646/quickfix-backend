const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  STRICT VALIDATION
    if (!decoded._id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      _id: decoded._id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
};

module.exports = userAuth;
