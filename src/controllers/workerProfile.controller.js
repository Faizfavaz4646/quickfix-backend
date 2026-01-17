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

    // Validate request body
    const { error, value } = upsertWorkerProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: "Validation error", details: error.details });
    }

    const userId = req.user._id;

    // UPSERT profile
    const profile = await WorkerProfile.findOneAndUpdate(
      { userId },
      { $set: value },
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

    // Return null if profile does not exist
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
      .populate("userId", "name email")
      .lean();

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.status(200).json({
      ...worker,
      name: worker.userId?.name || "",
      email: worker.userId?.email || "",
      userId: worker.userId?._id,
    });
  } catch (err) {
    console.error("Get worker by profile ID failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get worker profile by USER ID (internal use)
 * Auth required
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
 * Returns flattened data for frontend
 */
exports.searchWorkers = async (req, res) => {
  try {
    const { profession, location } = req.query;
    const query = {};

    if (profession) query.profession = new RegExp(profession, "i");
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

    // Flatten user data for frontend
    const formattedWorkers = workers.map((worker) => ({
      ...worker,
      name: worker.userId?.name || "",
      email: worker.userId?.email || "",
      userId: worker.userId?._id,
    }));

    return res.status(200).json(formattedWorkers);
  } catch (err) {
    console.error("Worker search failed:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};
