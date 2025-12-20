// const express = require("express");
// const { validateSignupData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../model/user");




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

exports.login = async (req ,res)=>{
  try {

    const {emailId , password}=req.body;
    const user = await User.findOne({emailId});
    if(!user)(
      res.status(401).json({message :"Invalid credentials"})
    )
    if(user.status === blocked){
      return res.status(403).json({ message: "Account blocked" });

    }
    const isValid = await user.validatePassword(password);
    if(!isValid){
       return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = await user.getJwt();

    res.cookie("token",token,{
      httpOnly:true,
      sameSite:"lax"
    });

    res.json({
      user:{
        id: user._id,
        name:user.name,
        role:user.role,

      },
      token,
    })


  }catch(err){
    res.status(500).json({ message: "Login failed" });

  }
}



// authRouter.post("/login", async (req, res) => {
//   try {
//     const { emailId, password } = req.body;

//     // 1. Check user exists
//     const user = await User.findOne({ emailId });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // 2. Check blocked status
//     if (user.status === "blocked") {
//       return res.status(403).json({
//         message: "Your account is blocked. Contact admin.",
//       });
//     }

//     // 3. Validate password
//     const isPasswordValid = await user.validatePassword(password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // 4. Generate token
//     const token = await user.getJwt();

//     // 5. (Optional) set cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: false, // true in production with https
//     });

//     // 6. Send REQUIRED response
//     res.status(200).json({
//       user: {
//         _id: user._id,
//         name: user.name,
//         emailId: user.emailId,
//         role: user.role,
//         status: user.status,
//       },
//       token,
//     });

//   } catch (err) {
//     res.status(500).json({ message: "Login failed" });
//   }
// });

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
};





