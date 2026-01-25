const mongoose = require("mongoose");
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

/* ================= GET PENDING REQUESTS (Worker View) ================= */
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

/* ================= GET ACTIVE JOBS (Worker View - Aggregation) ================= */
exports.getWorkerActiveJobs = async (req, res) => {
  try {
    const workerId = new mongoose.Types.ObjectId(req.user._id);

    const activeJobs = await JobRequest.aggregate([
      // A. Match: Only accepted jobs for this worker
      { 
        $match: { 
          workerId: workerId, 
          status: "accepted" 
        } 
      },
      // B. Lookup: Get basic User info
      {
        $lookup: {
          from: "users",            
          localField: "clientId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },

      // C. Lookup: Get Profile Pic from 'clientprofiles'
      {
        $lookup: {
          from: "clientprofiles",   
          localField: "clientId",   
          foreignField: "userId",   
          as: "clientProfileData"
        }
      },
      { 
        $unwind: { 
          path: "$clientProfileData", 
          preserveNullAndEmptyArrays: true 
        } 
      },

      // D. Sort
      { $sort: { scheduledDate: 1 } },

      // E. Project
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          address: 1,
          clientPhone: 1,
          scheduledDate: 1,
          status: 1,
          clientId: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
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

/* ================= GET COMPLETED JOBS (Worker View) ================= */
exports.getWorkerCompletedJobs = async (req, res) => {
  try {
    const workerId = req.user._id;

    const completedJobs = await JobRequest.find({ 
      workerId, 
      status: "completed" 
    })
    .sort({ updatedAt: -1 });

    res.json(completedJobs);
  } catch (err) {
    console.error("Get completed jobs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL REQUESTS (Worker View - History) ================= */
exports.getAllWorkerRequests = async (req, res) => {
  try {
    const workerId = new mongoose.Types.ObjectId(req.user._id);
    
    const requests = await JobRequest.aggregate([
      { $match: { workerId: workerId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "clientUser"
        }
      },
      { $unwind: "$clientUser" },
      {
        $lookup: {
          from: "clientprofiles",
          localField: "clientId",
          foreignField: "userId",
          as: "clientProfile"
        }
      },
      { 
        $unwind: { 
          path: "$clientProfile", 
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
          clientId: {
            _id: "$clientUser._id",
            name: "$clientUser.name",
            email: { $ifNull: ["$clientUser.email", "$clientUser.emailId"] },
            profilePic: { 
              $ifNull: ["$clientProfile.profilePic", "$clientUser.profilePic"] 
            }
          }
        }
      }
    ]);

    res.json(requests);
  } catch (err) {
    console.error("Get all requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL CLIENT REQUESTS (Client View) ================= */
// ✅ THIS IS THE NEW FUNCTION
exports.getClientRequests = async (req, res) => {
  try {
    // 1. Get Logged in Client ID
    const clientId = new mongoose.Types.ObjectId(req.user._id);
    const { status } = req.query; // allow filtering ?status=pending

    // 2. Build Match Query
    const matchQuery = { clientId: clientId };
    if (status) {
        matchQuery.status = status;
    }

    const requests = await JobRequest.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },

      // 3. Lookup WORKER User Info
      {
        $lookup: {
          from: "users",
          localField: "workerId",
          foreignField: "_id",
          as: "workerUser"
        }
      },
      { $unwind: "$workerUser" },

      // 4. Lookup WORKER Profile Info (Profession, Rating, etc.)
      {
        $lookup: {
          from: "workerprofiles", // Assumes your collection is named 'workerprofiles'
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

      // 5. Project (Shape Data for Frontend)
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          address: 1,
          status: 1,
          scheduledDate: 1,
          createdAt: 1,
          // Map Worker Details
          workerId: {
            _id: "$workerUser._id",
            name: "$workerUser.name",
            email: { $ifNull: ["$workerUser.email", "$workerUser.emailId"] },
            profilePic: { $ifNull: ["$workerProfile.profilePic", "$workerUser.profilePic"] },
            profession: "$workerProfile.profession",
            averageRating: "$workerUser.averageRating"
          }
        }
      }
    ]);

    res.json(requests);
  } catch (err) {
    console.error("Get client requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};