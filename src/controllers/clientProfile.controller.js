const ClientProfile = require("../model/clientProfile");
const User = require("../model/user"); //

exports.upsertClientProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- 1. Update User Name (if provided) ---
    if (req.body.name) {
      await User.findByIdAndUpdate(userId, { name: req.body.name });
    }

    // --- 2. Update Client Profile ---
    const allowedFields = [
      "phone",
      "gender",
      "state",
      "district",
      "city",
      "zip",
      "profilePic",
      "preferences",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if we have profile data to update. 
    // If NOT, but we DID update the name, we should still return success.
    if (Object.keys(updateData).length === 0) {
      if (req.body.name) {
        return res.status(200).json({ message: "Name updated successfully" });
      }
      return res.status(400).json({
        message: "No valid fields to update",
      });
    }

    const profile = await ClientProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      profile,
    });
  } catch (err) {
    console.error("Client profile update failed:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    // Populate the 'userId' field to get the name from the User model
    const profile = await ClientProfile.findOne({ userId: req.user._id })
      .populate("userId", "name emailId"); 

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Flatten the response so frontend gets { ...profile, name: "..." }
    const responseObj = {
        ...profile.toObject(),
        name: profile.userId?.name,
        email: profile.userId?.emailId
    };

    res.status(200).json(responseObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};