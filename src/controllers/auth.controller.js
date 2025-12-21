
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
    if(user.status === "blocked"){
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
        role:user.role

      },
      token,
    })


  }catch(err){
     console.error("Login failed:", err);
    res.status(500).json({ message: "Login failed",err });

  }
}



exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
};





