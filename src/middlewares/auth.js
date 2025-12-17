const User = require("../model/user");

const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const token = authHeader.split(" ")[1]; // extract token after "Bearer "
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedData;

    const user = await User.findById(_id);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};


module.exports =userAuth;