const ClientProfile = require("../model/clientProfile"); // Ensure casing matches your file
const User = require("../model/user");
const JobRequest = require("../model/jobRequests");

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
    const userId = req.user._id;

    // --- STEP 1: FETCH JOBS (The missing part) ---
    // We search the 'JobRequest' collection for any job linked to this client
    const allJobs = await JobRequest.find({ clientId: userId })
      .populate("workerId", "name profession profilePic") // Get worker details for the card
      .sort({ createdAt: -1 });

    // Separate jobs into categories for the dashboard
    const requests = allJobs.filter(j => j.status === "pending");
    const activeJobs = allJobs.filter(j => j.status === "accepted" || j.status === "ongoing");
    const completedJobs = allJobs.filter(j => j.status === "completed" || j.status === "rejected");

    // --- STEP 2: FETCH PROFILE ---
    const profile = await ClientProfile.findOne({ userId })
      .populate("userId", "name emailId");

    // --- STEP 3: CONSTRUCT RESPONSE ---
    
    // CASE A: Profile Found
    if (profile) {
      return res.status(200).json({
        ...profile.toObject(),
        name: profile.userId?.name,
        email: profile.userId?.emailId,
        // ✅ Add the jobs here so the dashboard works
        requests,
        activeJobs,
        completedJobs
      });
    }

    // CASE B: Profile Not Found (New User)
    // We still return the jobs (even if profile is empty) + User data
    const user = await User.findById(userId);
    
    return res.status(200).json({
      // Basic Fields
      phone: "", 
      gender: "", 
      state: "", 
      district: "", 
      city: "", 
      zip: "", 
      profilePic: "",
      name: user?.name,
      email: user?.emailId,
      requests,
      activeJobs,
      completedJobs
    });

  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};