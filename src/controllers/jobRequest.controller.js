const mongoose = require("mongoose"); // 👈 REQUIRED for Aggregation
const JobRequest = require("../model/jobRequests");
const Notification = require("../model/notifications");

/* ================= CREATE JOB REQUEST ================= */
exports.createJobRequest = async (req, res) => {
  try {
    console.log("📨 [DEBUG] Incoming Request Body:", req.body);

    const clientId = req.user._id;
    const { workerId, title, description, address, scheduledDate, clientPhone } = req.body;

    if (!workerId || !title || !description || !clientPhone) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const existingRequest = await JobRequest.findOne({
      clientId,
      workerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({ message: "Request already pending" });
    }

    const job = await JobRequest.create({
      clientId,
      workerId,
      title,
      description,
      address,
      scheduledDate,
      clientPhone,
      status: "pending",
    });

    console.log("✅ [DEBUG] Job Saved Successfully:", job._id);

    try {
        const newNotification = await Notification.create({
            userId: workerId,
            title: "New Job Request",
            message: `New request: ${title}`,
            type: "job_request",
            relatedId: job._id,
            isRead: false
        });

        if (global.SendNotificationRealTime) {
            global.SendNotificationRealTime(newNotification);
        }
    } catch (notifError) {
        console.error("⚠️ [DEBUG] Notification Failed:", notifError.message);
    }

    res.status(201).json(job);
  } catch (err) {
    console.error("❌ [DEBUG] Create Request FAILED:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PENDING REQUESTS ================= */
exports.getWorkerPendingRequests = async (req, res) => {
  try {
    const workerId = req.user._id;
    const requests = await JobRequest.find({ workerId, status: "pending" })
      .populate("clientId", "name email profilePic") 
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Get pending requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE JOB STATUS ================= */
exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const job = await JobRequest.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    job.status = status;
    await job.save();

    try {
        const notification = await Notification.create({
            userId: job.clientId,       
            title: `Request ${status}`,  
            message: `Your request "${job.title}" was ${status}`,
            type: "job_update",
            relatedId: job._id,
            isRead: false
        });

        if (global.SendNotificationRealTime) {
            global.SendNotificationRealTime(notification);
        }
    } catch (notifErr) {
        console.error("⚠️ [DEBUG] Update Notification Failed:", notifErr.message);
    }

    res.json(job);
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ACTIVE JOBS (FIXED WITH AGGREGATION) ================= */
exports.getWorkerActiveJobs = async (req, res) => {
  try {
    // 1. Convert User ID to ObjectId for Aggregation
    const workerId = new mongoose.Types.ObjectId(req.user._id);

    // 2. Run Aggregation Pipeline to "Join" 3 Collections (Jobs + Users + ClientProfiles)
    const activeJobs = await JobRequest.aggregate([
      // A. Match: Only accepted jobs for this worker
      { 
        $match: { 
          workerId: workerId, 
          status: "accepted" 
        } 
      },

      // B. Lookup: Get basic User info (Name, Email)
      {
        $lookup: {
          from: "users",            
          localField: "clientId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" }, // Flatten array

      // C. Lookup: Get Profile Pic from 'clientprofiles' collection
      {
        $lookup: {
          from: "clientprofiles",   // ✅ MATCHING YOUR MONGODB COLLECTION NAME
          localField: "clientId",   // Link using the User ID
          foreignField: "userId",   // Match it to 'userId' in profiles
          as: "clientProfileData"
        }
      },
      // Unwind safely (keep job even if profile is missing)
      { 
        $unwind: { 
          path: "$clientProfileData", 
          preserveNullAndEmptyArrays: true 
        } 
      },

      // D. Sort: Show soonest jobs first
      { $sort: { scheduledDate: 1 } },

      // E. Project: Shape the final data for your Frontend
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          address: 1,
          clientPhone: 1,
          scheduledDate: 1,
          status: 1,
          // Reconstruct 'clientId' object so frontend works automatically
          clientId: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            
            // ✅ THE FIX: Grab pic from 'clientProfileData' first!
            profilePic: { 
              $ifNull: ["$clientProfileData.profilePic", "$userDetails.profilePic"] 
            },
            
            phone: { $ifNull: ["$clientProfileData.phone", "$userDetails.phone"] },
            city: "$clientProfileData.city" 
          }
        }
      }
    ]);

    res.json(activeJobs);
  } catch (err) {
    console.error("Get active jobs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getWorkerCompletedJobs = async (req, res) => {
  try {
    const workerId = req.user._id;

    // Simple find because we just need the count (and maybe basic details)
    const completedJobs = await JobRequest.find({ 
      workerId, 
      status: "completed" 
    })
    .sort({ updatedAt: -1 }); // Most recently completed first

    res.json(completedJobs);
  } catch (err) {
    console.error("Get completed jobs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};