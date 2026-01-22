const JobRequest = require("../model/jobRequests");
const Notification = require("../model/notifications");

/* ================= CREATE JOB REQUEST ================= */
exports.createJobRequest = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { workerId } = req.body;

    // Prevent duplicate pending requests
    const existingRequest = await JobRequest.findOne({
      clientId,
      workerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "You already have a pending request for this worker",
      });
    }

    const job = await JobRequest.create({
      ...req.body,
      clientId,
      status: "pending",
    });

    // Notification Logic
    const notification = await Notification.create({
      userId: workerId,
      title: "New Job Request",
      message: `You have a new request: ${req.body.title}`,
      type: "job_request",
      relatedId: job._id,
    });

    if (global.SendNotificationRealTime) {
      global.SendNotificationRealTime(notification);
    }

    res.status(201).json(job);
  } catch (err) {
    console.error("Create job request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PENDING REQUESTS (Fixes 404) ================= */
exports.getWorkerPendingRequests = async (req, res) => {
  try {
    const workerId = req.user._id;
    
    // Filter specifically for "pending" status
    const requests = await JobRequest.find({ 
      workerId, 
      status: "pending" 
    })
    .populate("clientId", "name email profilePic") // Ensure profilePic is populated
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

    // Security check
    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    job.status = status;
    await job.save();

    // Notify Client
    const notification = await Notification.create({
      userId: job.clientId,
      title: `Request ${status}`,
      message: `Your job request "${job.title}" was ${status}`,
      type: "job_update",
      relatedId: job._id,
    });

    if (global.SendNotificationRealTime) {
      global.SendNotificationRealTime(notification);
    }

    res.json(job);
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};