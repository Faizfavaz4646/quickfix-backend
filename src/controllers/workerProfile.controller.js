const mongoose = require("mongoose");
const WorkerProfile = require("../model/workerProfile");
const { upsertWorkerProfileSchema } = require("../utils/validation");
const asyncHandler = require("../utils/asyncHandler");

/* ================= 1. CREATE or UPDATE PROFILE (UPSERT) ================= */
exports.upsertWorkerProfile = asyncHandler(async (req, res) => {
  // Joi Validation
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

/* ================= 2. GET LOGGED-IN WORKER PROFILE ================= */
exports.getWorkerProfile = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ userId: req.user._id });
  res.status(200).json(profile || null);
});

/* ================= 3. GET WORKER BY PROFILE ID (For Profile Page) ================= */
exports.getWorkerProfileById = asyncHandler(async (req, res) => {
  // Search using the USER ID (since URL passes: /workerprofile/USER_ID)
  const worker = await WorkerProfile.findOne({ userId: req.params.id })
    // ✅ FIX: Ask for 'emailId' explicitly.
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
    // ✅ FIX: Check for emailId
    email: worker.userId?.email || worker.userId?.emailId || "", 
    // ✅ FIX: Robust Image Logic (Worker > User > Empty)
    profilePic: worker.profilePic || worker.userId?.profilePic || "", 
    userId: worker.userId?._id, 
  });
});

/* ================= 4. SEARCH WORKERS (Public Aggregation) ================= */
exports.searchWorkers = asyncHandler(async (req, res) => {
  const { profession, location } = req.query;
  const pipeline = [];

  // Filter by Profession
  if (profession) {
    pipeline.push({
      $match: { profession: { $regex: new RegExp(profession, "i") } }
    });
  }

  // Filter by Location
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

  // Lookup Data & Reviews
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

  // Calculate Fields
  pipeline.push({
    $addFields: {
      calculatedAvg: { $avg: "$workerReviews.rating" },
      calculatedCount: { $size: "$workerReviews" },
      jobsCompletedCount: { $size: "$completedJobsData" },
      name: { $ifNull: ["$userData.name", "Service Provider"] },
      finalProfilePic: { $ifNull: ["$profilePic", "$userData.profilePic"] }
    }
  });

  // Final Projection
  pipeline.push({
    $project: {
      _id: 1,
      userId: 1,
      name: 1,
      profession: 1,
      city: 1,
      district: 1,
      profilePic: "$finalProfilePic", 
      averageRating: { $ifNull: [{ $round: ["$calculatedAvg", 1] }, 0] },
      totalReviews: "$calculatedCount",
      jobsDone: "$jobsCompletedCount"
    }
  });

  const workers = await WorkerProfile.aggregate(pipeline);
  res.status(200).json(workers);
});

/* ================= 5. GET WORKER BY USER ID QUERY ================= */
exports.getWorkerByUserIdParam = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    const err = new Error("User ID required");
    err.statusCode = 400;
    throw err;
  }

  const worker = await WorkerProfile.find({ userId })
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
      email: w.userId?.email || w.userId?.emailId, 
      profilePic: w.profilePic || w.userId?.profilePic || "", 
      userId: w.userId?._id,
      averageRating: w.averageRating || 0,
      totalReviews: w.totalReviews || 0
  }));

  res.status(200).json(formattedWorker);
});

/* ================= 6. GET TOP RATED WORKERS (For Sidebar) ================= */
// Route: GET /api/workers?sort=-rating&limit=3
exports.getTopWorkers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const sortParam = req.query.sort || '-rating';

  // 1. Determine Sort Order
  let sortStage = {};
  if (sortParam === '-rating') {
    sortStage = { averageRating: -1 }; // Highest Rating First
  } else if (sortParam === 'rating') {
    sortStage = { averageRating: 1 };
  } else {
    sortStage = { createdAt: -1 };
  }

  const workers = await WorkerProfile.aggregate([
    // A. Filter (Optional: You can add { isVerified: true } here later)
    { $match: { averageRating: { $exists: true } } }, 

    // B. Sort
    { $sort: sortStage },

    // C. Limit
    { $limit: limit },

    // D. Join with Users to get Name/Pic
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDoc"
      }
    },
    { $unwind: "$userDoc" },

    // E. Project exact fields for Frontend Sidebar
    {
      $project: {
        // IMPORTANT: We return the 'userId' as '_id' because 
        // the frontend Link is: /client/workerprofile/${worker._id}
        // and that page expects a User ID, not a WorkerProfile ID.
        _id: "$userId", 
        name: "$userDoc.name",
        profession: 1,
        rating: "$averageRating",
        // Image Logic: WorkerProfile Pic > User Profile Pic > null
        profilePic: { $ifNull: ["$profilePic", "$userDoc.profilePic"] }
      }
    }
  ]);

  // Return structure matching: response.data.data
  res.status(200).json({
    success: true,
    count: workers.length,
    data: workers
  });
});