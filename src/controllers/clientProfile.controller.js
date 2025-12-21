const ClientProfile = require("../model/clientProfile")




 exports.upsertClientProfile = async (req , res)=>{
    try {
        const userId =req.user._id;

        const profile = await ClientProfile.findOneAndUpdate(
            {userId},
            {$set : req.body},
            {new :true, upsert:true}
        );
        res.status(200).json({
            message :"profile updated successfully",
            profile
        })

    }catch (err){
        console.error("Client profile update failed:", err);
    res.status(500).json({
      message: "Internal server error"
       });

    }
 }