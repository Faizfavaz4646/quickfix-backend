const ClientProfile = require("../model/clientProfile"); // Ensure casing matches your file
const User = require("../model/user");

exports.upsertClientProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- 1. Update User Name (if provided) ---
    // We store the updated name to send it back later
    let currentName = req.user.name; 
    if (req.body.name) {
      await User.findByIdAndUpdate(userId, { name: req.body.name });
      currentName = req.body.name;
    }

    // --- 2. Update Client Profile ---
    const allowedFields = [
      "phone", "gender", "state", "district", "city", "zip", "profilePic", "preferences",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      // Safety: Allow empty strings "", but ignore undefined
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle case where only name is updated but no profile fields
    if (Object.keys(updateData).length === 0) {
      if (req.body.name) {
        // ✅ FIX 1: Return consistent structure even if only name changed
        return res.status(200).json({ 
          message: "Name updated successfully",
          profile: { 
             // We return a minimal profile object so frontend doesn't break
             name: currentName 
          }
        });
      }
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const profile = await ClientProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    // ✅ FIX 2: Merge the Name into the response
    // The 'profile' doc doesn't have the name, so we add it manually
    const responseObj = {
      ...profile.toObject(),
      name: currentName, 
    };

    res.status(200).json({
      message: "Profile updated successfully",
      profile: responseObj,
    });
    
  } catch (err) {
    console.error("Client profile update failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    // 1. Try to find the profile
    const profile = await ClientProfile.findOne({ userId: req.user._id })
      .populate("userId", "name emailId"); // Grab name/email from User model

    // 2. CASE A: Profile Found
    if (profile) {
      return res.status(200).json({
        ...profile.toObject(),
        name: profile.userId?.name,
        email: profile.userId?.emailId
      });
    }

    // 3. CASE B: Profile Not Found (New User) - THIS IS THE FIX
    // Instead of sending 404, we send the basic User data so the form can pre-fill
    const user = await User.findById(req.user._id);
    
    return res.status(200).json({
      // Send empty strings for profile fields so React inputs are controlled
      phone: "", 
      gender: "", 
      state: "", 
      district: "", 
      city: "", 
      zip: "", 
      profilePic: "",
      // Send the known user data
      name: user.name,
      email: user.emailId
    });

  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};