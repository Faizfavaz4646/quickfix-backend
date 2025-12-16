const express = require("express");
const { validateSignupData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../model/user");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    //  Validate request body
    const { isValid, errors } = validateSignupData(req.body);
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    let { name, emailId, password, role } = req.body;

    // Normalize email
    emailId = emailId.toLowerCase();

    // Check for duplicate email (DB check belongs HERE)
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    //  Create user
    const user = new User({
      name,
      emailId,
      password: passwordHash,
      role,
      status: "active",
    });

    await user.save();

    //  Respond (NO token on signup — correct decision)
    return res.status(201).json({
      message: "User registered successfully",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // 1. Check user exists
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Check blocked status
    if (user.status === "blocked") {
      return res.status(403).json({
        message: "Your account is blocked. Contact admin.",
      });
    }

    // 3. Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Generate token
    const token = await user.getJwt();

    // 5. (Optional) set cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in production with https
    });

    // 6. Send REQUIRED response
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        emailId: user.emailId,
        role: user.role,
        status: user.status,
      },
      token,
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production with HTTPS
    path: "/"
  });

  res.status(200).json({ message: "Logout successful.!!" });
});



module.exports = authRouter;
