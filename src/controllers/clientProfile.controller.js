
const ClientProfile = require("../model/clientProfile")




 exports.upsertClientProfile = async (req , res)=>{
    try {
        const userId =req.user._id;

        const allowedFields = [
      "phone",
      "gender",
      "state",
      "district",
      "city",
      "zip",
      "profilePic",
      "preferences"
    ];
    const updateData ={};
    allowedFields.forEach((field)=>{
        if(req.body[field] !== undefined){
            updateData[field] =req.body[field];
        }
    });
    if(Object.keys(updateData).length === 0){
        return res.status(400).json({
             message: "No valid fields to update"
        })
    }
        const profile = await ClientProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
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

 exports.getClientProfile = async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
