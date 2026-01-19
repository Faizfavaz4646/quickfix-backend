const JobRequest = require("../model/jobRequests");
const Notification = require("../model/notifications");

/* ================= CREATE ================= */
exports.createJobRequest = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { workerId } = req.body;

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

    // 🔔 NOTIFY WORKER
    await Notification.create({
      userId: workerId,
      title: "New job request",
      message: "You have received a new job request",
      type: "job_request",
      relatedId: job._id,
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= WORKER ================= */
exports.getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.user._id;

    const requests = await JobRequest.find({ workerId })
      .populate("clientId", "name email");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CLIENT ================= */
exports.getClientRequests = async (req, res) => {
  try {
    const clientId = req.user._id;

    const requests = await JobRequest.find({ clientId })
      .populate("workerId", "name email");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= STATUS ================= */
exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await JobRequest.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    //  Only assigned worker can update
    if (
      req.user.role !== "worker" ||
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    job.status = status;
    await job.save();

    //  Notify CLIENT 
    await Notification.create({
      userId: job.clientId, 
      title: "Job status updated",
      message: `Your job request status is now "${status}"`,
      type: "job_update",
      relatedId: job._id,
    });

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

