
const bcrypt = require("bcrypt");
const User = require("../model/user");
const ClientProfile = require("../model/clientProfile");




exports.signup = async (req,res)=>{
  try {
    const {name,emailId,password,role} = req.body;
    const existingUser = await User.findOne({emailId});
    if(existingUser){
      return res.status(409).json({message: "Email already registered"})
    }

    const passwordHash = await bcrypt.hash(password,10);
    await User.create({
      name,
      emailId,
      password:passwordHash,
      role,
      status :"active"
    });

    res.status(201).json({message:"User registered successfully"});

  }catch(err){
    res.status(500).json({message:"Interna;l server error"});

  }
};

exports.login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // 1. Validate User
    const user = await User.findOne({ emailId });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "blocked") return res.status(403).json({ message: "Account blocked" });

    const isValid = await user.validatePassword(password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = await user.getJwt();

    // 2. ⚡️ CRITICAL FIX: Fetch the separate ClientProfile
    let profileData = {}; 
    if (user.role === "client") {
      const clientProfile = await ClientProfile.findOne({ userId: user._id });
      if (clientProfile) {
        // Convert to object so we can merge it
        profileData = clientProfile.toObject();
      }
    }

    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    // 3. Send Merged Response
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.emailId,
        role: user.role,
        profile: profileData // ✅ Frontend needs this for the Navbar & Edit Form
      },
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};



exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
};





