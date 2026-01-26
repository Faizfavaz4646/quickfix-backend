const mongoose = require("mongoose");
const User = require("../model/user");
const ClientProfile = require("../model/clientProfile");
const JobRequest = require("../model/jobRequests");
const asyncHandler = require("../utils/asyncHandler");

/* ================= UPDATE / CREATE PROFILE (UPSERT) ================= */
// ✅ Wrapped in asyncHandler to catch validation or DB errors automatically
exports.upsertClientProfile = asyncHandler(async (req, res) => {
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

  // Handle case where no profile-specific fields are updated
  if (Object.keys(updateData).length === 0) {
    if (req.body.name) {
      return res.status(200).json({
        message: "Name updated successfully",
        profile: { name: currentName }
      });
    }
    // Standardizing error throw
    const error = new Error("No valid fields to update");
    error.statusCode = 400;
    throw error;
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
});

/* ================= GET CLIENT PROFILE (DASHBOARD DATA) ================= */
// ✅ Aggregation logic remains the same but error handling is now centralized
exports.getClientProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // --- STEP 1: FETCH JOBS (AGGREGATION) ---
  const allJobs = await JobRequest.aggregate([
    { $match: { clientId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "workerId",
        foreignField: "_id",
        as: "workerUser"
      }
    },
    { $unwind: "$workerUser" },
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

  // Handle case where user record is missing
  if (!userData) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const responseData = profile ? profile.toObject() : {};

  return res.status(200).json({
    profile: {
      ...responseData,
      name: profile?.userId?.name || userData.name,
      email: profile?.userId?.emailId || userData.emailId,
      city: responseData.city || "",
      district: responseData.district || "",
      state: responseData.state || "",
      profilePic: responseData.profilePic || "",
    },
    requests,
    activeJobs,
    completedJobs
  });
});