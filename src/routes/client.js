const express = require("express");
const ClientProfileRouter = express.Router()
const userAuth = require("../middlewares/auth")
const roleAuth = require("../middlewares/role")
const ClientProfile = require("../model/clientProfile")
const {validateClientProfileData} = require("../utils/validation")



ClientProfileRouter.patch("/profile",userAuth,roleAuth(["client"]),async (req,res)=>{
    try{

        if(!validateClientProfileData(req.body)){
           return res.status(400).json({message:"Invalid fields"})
        }
       const profile = await ClientProfile.findOneAndUpdate(
        {userId: req.user._id},
        {$set: req.body},
        {new: true , upsert:true}
       );
       res.status(200).json({
        message: "Profile updated",
        profile
       });
        
    }catch(err){
            res.status(400).send("ERROR :" + err.message)

    }

})
module.exports =ClientProfileRouter;
