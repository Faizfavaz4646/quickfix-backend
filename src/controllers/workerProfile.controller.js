const WorkerProfile = require("../model/workerProfile");
const { upsertWorkerProfileSchema } = require("../utils/validation");

/**
 * CREATE or UPDATE worker profile (UPSERT)
 * Auth required
 */
exports.upsertWorkerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { error, value } = upsertWorkerProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: "Validation error", details: error.details });
    }

    const userId = req.user._id;

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId },
      { $set: value },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Worker profile upsert failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get logged-in worker's profile
 */
exports.getWorkerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const profile = await WorkerProfile.findOne({ userId: req.user._id });
    return res.status(200).json(profile || null);
  } catch (err) {
    console.error("Fetch worker profile failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get worker profile by PROFILE ID (public)
 */
exports.getWorkerProfileById = async (req, res) => {
  try {
    const worker = await WorkerProfile.findById(req.params.id)
      .populate("userId", "name emailId profilePic") 
      .lean();

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.status(200).json({
      ...worker,
      name: worker.userId?.name || "Service Provider",
      email: worker.userId?.emailId || "", 
      // Fallback for profile pic if not in profile doc
      profilePic: worker.profilePic || worker.userId?.profilePic || "", 
      userId: worker.userId?._id, 
    });
  } catch (err) {
    console.error("Get worker by profile ID failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get worker profile by USER ID (internal)
 */
exports.getWorkerByUserId = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const worker = await WorkerProfile.findOne({ userId: req.user._id })
      .populate("userId", "name email profilePic");

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.status(200).json(worker);
  } catch (err) {
    console.error("Get worker by userId failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Search workers (public)
 * Query: profession, location
 * ✅ UPDATED: Includes Ratings from Profile
 */
exports.searchWorkers = async (req, res) => {
  try {
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

    // 3. Lookup User Info
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData"
      }
    });
    pipeline.push({ $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } });

    // 4. Lookup Reviews (For Rating)
    pipeline.push({
      $lookup: {
        from: "reviews",
        localField: "userId",
        foreignField: "workerId",
        as: "workerReviews"
      }
    });

    // 5. 🔥 NEW: Lookup Completed Jobs
    // This connects WorkerProfile.userId -> JobRequest.workerId
    pipeline.push({
      $lookup: {
        from: "jobrequests", // Must match collection name in MongoDB
        let: { workerId: "$userId" },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [
                  { $eq: ["$workerId", "$$workerId"] }, // Match Worker
                  { $eq: ["$status", "completed"] }     // Only count COMPLETED jobs
                ]
              } 
            } 
          }
        ],
        as: "completedJobsData"
      }
    });

    // 6. Calculate & Flatten Fields
    pipeline.push({
      $addFields: {
        calculatedAvg: { $avg: "$workerReviews.rating" },
        calculatedCount: { $size: "$workerReviews" },
        
        // 🔥 Count the array of completed jobs found
        jobsCompletedCount: { $size: "$completedJobsData" },

        name: { $ifNull: ["$userData.name", "Service Provider"] },
        finalProfilePic: { $ifNull: ["$profilePic", "$userData.profilePic"] }
      }
    });

    // 7. Final Project
    pipeline.push({
      $project: {
        _id: 1,
        userId: 1,
        name: 1,
        profession: 1,
        city: 1,
        district: 1,
        finalProfilePic: 1,
        averageRating: { $ifNull: [{ $round: ["$calculatedAvg", 1] }, 0] },
        totalReviews: "$calculatedCount",
        jobsDone: "$jobsCompletedCount" // ✅ Send this new field to frontend
      }
    });

    const workers = await WorkerProfile.aggregate(pipeline);

    return res.status(200).json(workers);

  } catch (err) {
    console.error("Worker search failed:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};

exports.getWorkerByUserIdParam = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const worker = await WorkerProfile.find({ userId })
      .populate("userId", "name email profilePic")
      .lean();

    if (!worker || worker.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const formattedWorker = worker.map(w => ({
        ...w,
        name: w.userId?.name,
        email: w.userId?.email,
        profilePic: w.userId?.profilePic,
        userId: w.userId?._id,
        averageRating: w.averageRating || 0,
        totalReviews: w.totalReviews || 0
    }));

    return res.status(200).json(formattedWorker);
  } catch (err) {
    console.error("Get worker by query failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
};