const JobRequest = require("../model/jobRequests");
const User = require("../model/user");
const Notifications = require("../model/notifications")

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

    // ❌ REDUNDANT CHECK (Joi already handles this)
    // REMOVE this block entirely
    // if (!workerId || !title || !scheduledDate) { ... }

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

    const job = await JobRequest.create({
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

    // 🔔 CREATE NOTIFICATION
    const client = await User.findById(clientId).select("name");

    await Notifications.create({
      userId: workerId,
      type: "JOB_REQUEST",
      message: `${client.name} sent a job request to you`,
      data: {
        jobId: job._id,
        clientId,
      },
    });

    res.status(201).json({
      message: "Job request sent successfully",
      job,
    });
  } catch (err) {
    console.error("Create job request failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};
