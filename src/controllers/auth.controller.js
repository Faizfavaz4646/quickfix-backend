const bcrypt = require("bcrypt");
const User = require("../model/user");
const ClientProfile = require("../model/clientProfile");
const asyncHandler = require("../utils/asyncHandler");

// ✅ Signup rewritten with asyncHandler
exports.signup = asyncHandler(async (req, res) => {
  const { name, emailId, password, role } = req.body;

  const existingUser = await User.findOne({ emailId });
  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  await User.create({
    name,
    emailId,
    password: passwordHash,
    role,
    status: "active"
  });

  res.status(201).json({ message: "User registered successfully" });
});

// ✅ Login rewritten with asyncHandler
exports.login = asyncHandler(async (req, res) => {
  const { emailId, password } = req.body;

  // 1. Validate User
  const user = await User.findOne({ emailId });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (user.status === "blocked") {
    const error = new Error("Account blocked");
    error.statusCode = 403;
    throw error;
  }

  const isValid = await user.validatePassword(password);
  if (!isValid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = await user.getJwt();

  // 2. Fetch Profile Data based on role
  let profileData = {}; 
  if (user.role === "client") {
    const clientProfile = await ClientProfile.findOne({ userId: user._id });
    if (clientProfile) {
      profileData = clientProfile.toObject();
    }
  }

  // Set secure cookie
  res.cookie("token", token, { 
    httpOnly: true, 
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" 
  });

  // 3. Send Merged Response
  res.json({
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.emailId,
      role: user.role,
      status: user.status,
      profile: profileData
    },
  });
});

// ✅ Logout (Synchronous, but standardized)
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
};