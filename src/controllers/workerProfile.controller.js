const mongoose = require("mongoose");
const WorkerProfile = require("../model/workerProfile");
const { upsertWorkerProfileSchema } = require("../utils/validation");
const asyncHandler = require("../utils/asyncHandler");

/* ================= CREATE or UPDATE PROFILE (UPSERT) ================= */
exports.upsertWorkerProfile = asyncHandler(async (req, res) => {
  // 1. Joi Validation
  const { error, value } = upsertWorkerProfileSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const err = new Error("Validation error");
    err.statusCode = 400;
    err.details = error.details;
    throw err;
  }

  const userId = req.user._id;

  const profile = await WorkerProfile.findOneAndUpdate(
    { userId },
    { $set: value },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json(profile);
});

/* ================= GET LOGGED-IN WORKER PROFILE ================= */
exports.getWorkerProfile = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ userId: req.user._id });
  res.status(200).json(profile || null);
});

/* ================= GET WORKER BY PROFILE ID (For Profile Page) ================= */
exports.getWorkerProfileById = asyncHandler(async (req, res) => {
  // 1. Search using the USER ID (since that is what your URL passes: /workerprofile/USER_ID)
  const worker = await WorkerProfile.findOne({ userId: req.params.id })
    // ✅ FIX 1: Ask for 'emailId' explicitly. Mongoose won't return it otherwise.
    .populate("userId", "name email emailId profilePic") 
    .lean();

  if (!worker) {
    const err = new Error("Worker not found");
    err.statusCode = 404;
    throw err;
  }

  res.status(200).json({
    ...worker,
    name: worker.name || worker.userId?.name || "Service Provider",
    // ✅ FIX 2: Check for emailId
    email: worker.userId?.email || worker.userId?.emailId || "", 
    // ✅ FIX 3: Robust Image Logic (Worker > User > Empty)
    profilePic: worker.profilePic || worker.userId?.profilePic || "", 
    userId: worker.userId?._id, 
  });
});

/* ================= SEARCH WORKERS (Public Aggregation) ================= */
exports.searchWorkers = asyncHandler(async (req, res) => {
  const { profession, location } = req.query;
  const pipeline = [];

  // 1. Filter by Profession
  if (profession) {
    pipeline.push({
      $match: { profession: { $regex: new RegExp(profession, "i") } }
    });
  }

  // 2. Filter by Location
  if (location) {
    pipeline.push({
      $match: {
        $or: [
          { city: { $regex: new RegExp(location, "i") } },
          { district: { $regex: new RegExp(location, "i") } },
          { state: { $regex: new RegExp(location, "i") } },
        ]
      }
    });
  }

  // 3. Lookup Data & Reviews
  pipeline.push(
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userData" } },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "reviews", localField: "userId", foreignField: "workerId", as: "workerReviews" } },
    {
      $lookup: {
        from: "jobrequests", 
        let: { workerId: "$userId" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$workerId", "$$workerId"] }, { $eq: ["$status", "completed"] }] } } }
        ],
        as: "completedJobsData"
      }
    }
  );

  // 4. Calculate Fields
  pipeline.push({
    $addFields: {
      calculatedAvg: { $avg: "$workerReviews.rating" },
      calculatedCount: { $size: "$workerReviews" },
      jobsCompletedCount: { $size: "$completedJobsData" },
      name: { $ifNull: ["$userData.name", "Service Provider"] },
      // Logic: If WorkerProfile has a pic, use it. Else use User pic.
      finalProfilePic: { $ifNull: ["$profilePic", "$userData.profilePic"] }
    }
  });

  // 5. Final Projection
  pipeline.push({
    $project: {
      _id: 1,
      userId: 1,
      name: 1,
      profession: 1,
      city: 1,
      district: 1,
      // Map 'finalProfilePic' to 'profilePic' so frontend finds it
      profilePic: "$finalProfilePic", 
      averageRating: { $ifNull: [{ $round: ["$calculatedAvg", 1] }, 0] },
      totalReviews: "$calculatedCount",
      jobsDone: "$jobsCompletedCount"
    }
  });

  const workers = await WorkerProfile.aggregate(pipeline);
  res.status(200).json(workers);
});

/* ================= GET WORKER BY USER ID QUERY ================= */
exports.getWorkerByUserIdParam = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    const err = new Error("User ID required");
    err.statusCode = 400;
    throw err;
  }

  const worker = await WorkerProfile.find({ userId })
    // ✅ FIX 4: Added 'emailId' here too
    .populate("userId", "name email emailId profilePic")
    .lean();

  if (!worker || worker.length === 0) {
    const err = new Error("Worker not found");
    err.statusCode = 404;
    throw err;
  }

  const formattedWorker = worker.map(w => ({
      ...w,
      name: w.userId?.name,
      // ✅ FIX 5: Fallback to emailId
      email: w.userId?.email || w.userId?.emailId, 
      // ✅ FIX 6: Prioritize Worker Profile Image
      profilePic: w.profilePic || w.userId?.profilePic || "", 
      userId: w.userId?._id,
      averageRating: w.averageRating || 0,
      totalReviews: w.totalReviews || 0
  }));

  res.status(200).json(formattedWorker);
});