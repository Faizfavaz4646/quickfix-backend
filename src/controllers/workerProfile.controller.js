const WorkerProfile = require("../model/workerProfile");

/**
 * CREATE or UPDATE worker profile (UPSERT)
 * Auth required
 */
exports.upsertWorkerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id;

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId },
      { $set: req.body },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Worker profile upsert failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get logged-in worker's profile
 * Auth required
 */
exports.getWorkerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await WorkerProfile.findOne({ userId: req.user._id });

    // IMPORTANT: return null instead of 404
    return res.status(200).json(profile || null);
  } catch (err) {
    console.error("Fetch worker profile failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Search workers (public)
 * Query: profession, location
 * Returns FLATTENED data for frontend
 */
exports.searchWorkers = async (req, res) => {
  try {
    const { profession, location } = req.query;

    const query = {};

    if (profession) {
      query.profession = new RegExp(profession, "i");
    }

    if (location) {
      query.$or = [
        { city: new RegExp(location, "i") },
        { district: new RegExp(location, "i") },
        { state: new RegExp(location, "i") },
      ];
    }

    const workers = await WorkerProfile.find(query)
      .populate("userId", "name email")
      .lean();

    // 🔥FLATTEN user data (critical fix)
    const formattedWorkers = workers.map((worker) => ({
      ...worker,
      name: worker.userId?.name || "",
      email: worker.userId?.email || "",
      userId: worker.userId?._id,
    }));

    res.status(200).json(formattedWorkers);
  } catch (err) {
    console.error("Worker search failed:", err);
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * Get worker profile by PROFILE ID (public)
 */
exports.getWorkerProfileById = async (req, res) => {
  try {
    const worker = await WorkerProfile.findById(req.params.id)
      .populate("userId", "name email")
      .lean();

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.json({
      ...worker,
      name: worker.userId?.name || "",
      email: worker.userId?.email || "",
      userId: worker.userId?._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
/**
 * Get worker profile by USER ID (internal use)
 * Used for ratings, notifications, requests
 */
exports.getWorkerByUserId = async (req, res) => {
  try {
    // userId must come from token, NOT params
    const userId = req.user._id;

    const worker = await WorkerProfile.findOne({ userId })
      .populate("userId", "name email profilePic");

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json(worker);
  } catch (err) {
    console.error("Get worker by userId failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};



