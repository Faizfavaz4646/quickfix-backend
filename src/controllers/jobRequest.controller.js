
const JobRequest = require("../model/jobRequests");

/**
 * CLIENT → Create job request
 */
exports.createJobRequest = async (req, res) => {
  try {
    const clientId = req.user._id;

    const {
      workerId,
      title,
      description,
      address,
      city,
      state,
      scheduledDate,
    } = req.body;

    if (!workerId || !title || !scheduledDate) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    // Prevent duplicate pending requests
    const existing = await JobRequest.findOne({
      clientId,
      workerId,
      status: "pending",
    });

    if (existing) {
      return res.status(409).json({
        message: "You already sent a request to this worker",
      });
    }

    const request = await JobRequest.create({
      clientId,
      workerId,
      title,
      description,
      address,
      city,
      state,
      scheduledDate,
      status: "pending",
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("Create job request failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * WORKER → View received requests
 */
exports.getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.user._id;

    const requests = await JobRequest.find({ workerId })
      .populate("clientId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("Fetch worker requests failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getClientRequests = async (req, res) => {
  try {
    const clientId = req.user._id;

    const requests = await JobRequest.find({ clientId })
      .populate("workerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("Fetch client requests failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateJobStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role; // 'client' or 'worker'
    const { id } = req.params;
    const { status } = req.body;

    const job = await JobRequest.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job request not found" });
    }

    /* ======================
       ROLE & OWNERSHIP CHECK
       ====================== */

    if (
      userRole === "worker" &&
      job.workerId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Not your job request" });
    }

    if (
      userRole === "client" &&
      job.clientId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Not your job request" });
    }

    /* ======================
       STATUS TRANSITION RULES
       ====================== */

    const current = job.status;

    const validTransitions = {
      pending: ["accepted", "rejected", "cancelled"],
      accepted: ["completed"],
    };

    if (!validTransitions[current]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${current} to ${status}`,
      });
    }

    /* ======================
       ROLE BASED ACTION RULES
       ====================== */

    if (
      ["accepted", "rejected", "completed"].includes(status) &&
      userRole !== "worker"
    ) {
      return res.status(403).json({
        message: "Only worker can perform this action",
      });
    }

    if (status === "cancelled" && userRole !== "client") {
      return res.status(403).json({
        message: "Only client can cancel a job",
      });
    }

    /* ======================
       UPDATE
       ====================== */

    job.status = status;
    await job.save();

    res.status(200).json({
      message: "Job status updated successfully",
      job,
    });
  } catch (err) {
    console.error("Update job status failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};


