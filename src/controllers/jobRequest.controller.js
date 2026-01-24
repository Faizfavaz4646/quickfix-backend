const JobRequest = require("../model/jobRequests");
const Notification = require("../model/notifications");

/* ================= CREATE JOB REQUEST ================= */
exports.createJobRequest = async (req, res) => {
  try {
    console.log("📨 [DEBUG] Incoming Request Body:", req.body);

    const clientId = req.user._id;
    const { workerId, title, description, address, scheduledDate, clientPhone } = req.body;

    // 1. Validation Check
    if (!workerId || !title || !description || !clientPhone) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // 2. Prevent Duplicate
    const existingRequest = await JobRequest.findOne({
      clientId,
      workerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({ message: "Request already pending" });
    }

    // 3. Create Job
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

    // --- 🔔 4. NOTIFICATION LOGIC (FIXED) ---
    try {
        const newNotification = await Notification.create({
            userId: workerId,           // Matches Schema
            // senderId: clientId,      <-- REMOVED (Not in your Schema)
            
            title: "New Job Request",   // ✅ ADDED (Required by Schema)
            message: `New request: ${title}`,
            
            type: "job_request",        // ✅ FIXED (Lowercase to match enum)
            
            relatedId: job._id,         // ✅ FIXED (Changed 'jobId' to 'relatedId')
            isRead: false
        });

        console.log("🔔 [DEBUG] Notification Saved to DB:", newNotification._id);

        if (global.SendNotificationRealTime) {
            global.SendNotificationRealTime(newNotification);
        }

    } catch (notifError) {
        console.error("⚠️ [DEBUG] Notification Failed:", notifError.message);
        // Tip: This log was effectively hiding the validation error before!
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

    // --- 🔔 UPDATE NOTIFICATION (FIXED) ---
    try {
        const notification = await Notification.create({
            userId: job.clientId,       
            
            title: `Request ${status}`,  
            message: `Your request "${job.title}" was ${status}`,
            
            type: "job_update",          // ✅ FIXED (Must use "job_update" per Schema)
            
            relatedId: job._id,          // ✅ FIXED (Changed 'jobId' to 'relatedId')
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
/* ================= GET ACTIVE JOBS ================= */
exports.getWorkerActiveJobs = async (req, res) => {
  try {
    const workerId = req.user._id;

    // Find jobs where status is 'accepted'
    const activeJobs = await JobRequest.find({ 
      workerId, 
      status: "accepted" 
    })
    .populate("clientId", "name email profilePic phone address") // Get client details
    .sort({ scheduledDate: 1 }); // Show soonest jobs first

    res.json(activeJobs);
  } catch (err) {
    console.error("Get active jobs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};