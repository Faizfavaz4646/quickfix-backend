const jwt = require("jsonwebtoken");
const User = require("../model/user");

const userAuth = async (req, res, next) => {
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

    //  FETCH USER FROM DB (IMPORTANT)
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    //  BLOCKED USER CHECK )
    if (user.isBlocked) {
      return res.status(403).json({
        error: "Your account has been blocked by admin",
      });
    }

    // attach all relevant info to req.user
    req.user = {
      _id: user._id,
      role: user.role,
      emailId: user.emailId,
      name: user.name,
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Token expired or invalid" });
  }
};

module.exports = userAuth;
