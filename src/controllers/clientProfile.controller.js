const mongoose = require("mongoose");
const User = require("../model/user");
const ClientProfile = require("../model/clientProfile");
const JobRequest = require("../model/jobRequests"); 

/* ================= UPDATE / CREATE PROFILE (UPSERT) ================= */
exports.upsertClientProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Update User Name (if provided)
    let currentName = req.user.name; 
    if (req.body.name) {
      await User.findByIdAndUpdate(userId, { name: req.body.name });
      currentName = req.body.name;
    }

    // 2. Update Client Profile Fields
    const allowedFields = [
      "phone", "gender", "state", "district", "city", "zip", "profilePic", "preferences",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle case where only name is updated
    if (Object.keys(updateData).length === 0) {
      if (req.body.name) {
        return res.status(200).json({ 
          message: "Name updated successfully",
          profile: { name: currentName }
        });
      }
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const profile = await ClientProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        ...profile.toObject(),
        name: currentName, 
      },
    });
    
  } catch (err) {
    console.error("Client profile update failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ================= GET CLIENT PROFILE (DASHBOARD DATA) ================= */
exports.getClientProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- STEP 1: FETCH JOBS (AGGREGATION) ---
    const allJobs = await JobRequest.aggregate([
      // 1. Find jobs for this client
      { $match: { clientId: new mongoose.Types.ObjectId(userId) } },
      // 2. Sort Newest First
      { $sort: { createdAt: -1 } },
      // 3. Lookup Worker User Info (Name)
      {
        $lookup: {
          from: "users",
          localField: "workerId",
          foreignField: "_id",
          as: "workerUser"
        }
      },
      { $unwind: "$workerUser" }, 
      // 4. Lookup Worker Profile Info (Picture)
      {
        $lookup: {
          from: "workerprofiles", 
          localField: "workerId",
          foreignField: "userId",
          as: "workerProfile"
        }
      },
      { 
        $unwind: { 
          path: "$workerProfile", 
          preserveNullAndEmptyArrays: true 
        } 
      },
      // 5. Shape the Data
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          address: 1,
          status: 1,
          scheduledDate: 1,
          clientPhone: 1,
          createdAt: 1,
          workerId: {
            _id: "$workerUser._id",
            name: "$workerUser.name",
            // Priority: WorkerProfile Pic -> User Pic
            profilePic: { $ifNull: ["$workerProfile.profilePic", "$workerUser.profilePic"] },
            profession: "$workerProfile.profession"
          }
        }
      }
    ]);

    const requests = allJobs.filter(j => j.status === "pending");
    const activeJobs = allJobs.filter(j => j.status === "accepted" || j.status === "ongoing");
    const completedJobs = allJobs.filter(j => j.status === "completed" || j.status === "rejected");

    // --- STEP 2: FETCH PROFILE ---
    const profile = await ClientProfile.findOne({ userId }).populate("userId", "name emailId");
    const userData = await User.findById(userId);

    // --- STEP 3: RETURN RESPONSE ---
    const responseData = profile ? profile.toObject() : {};

    return res.status(200).json({
      // ✅ FIX: Use "profile" key and spread responseData to include ALL fields
      profile: {
        ...responseData, // This automatically includes: district, state, zip, phone, city, etc.
        name: profile?.userId?.name || userData.name,
        email: profile?.userId?.emailId || userData.emailId,
        
        // Explicit defaults (just in case fields are missing in DB)
        city: responseData.city || "",
        district: responseData.district || "", 
        state: responseData.state || "",
        profilePic: responseData.profilePic || "",
      },

      // Job Lists
      requests,
      activeJobs,
      completedJobs
    });

  } catch (err) {
    console.error("Get Client Profile Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};