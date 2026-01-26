const mongoose = require("mongoose");
const JobRequest = require("../model/jobRequests");
const Notification = require("../model/notifications");
const asyncHandler = require("../utils/asyncHandler");

/* ================= CREATE JOB REQUEST ================= */
exports.createJobRequest = asyncHandler(async (req, res) => {
  const clientId = req.user._id;
  const { workerId, title, description, address, scheduledDate, clientPhone } = req.body;

  // Validation
  if (!workerId || !title || !description || !clientPhone) {
    const error = new Error("Missing required fields");
    error.statusCode = 400;
    throw error;
  }

  // Check for existing pending requests
  const existingRequest = await JobRequest.findOne({
    clientId,
    workerId,
    status: "pending",
  });

  if (existingRequest) {
    const error = new Error("Request already pending");
    error.statusCode = 409;
    throw error;
  }

  // Create Job
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

  // Notification Logic (Wrapped in local try-catch to prevent notification failure from breaking the response)
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
    console.error("⚠️ Notification Delivery Failed:", notifError.message);
  }

  res.status(201).json(job);
});

/* ================= UPDATE JOB STATUS ================= */
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const job = await JobRequest.findById(id);
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (job.workerId.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized to update this job");
    error.statusCode = 403;
    throw error;
  }

  job.status = status;
  await job.save();

  // Notify Client of Update
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
    console.error("⚠️ Status Notification Failed:", notifErr.message);
  }

  res.json(job);
});

/* ================= GET ACTIVE JOBS (Worker View) ================= */
exports.getWorkerActiveJobs = asyncHandler(async (req, res) => {
  const workerId = new mongoose.Types.ObjectId(req.user._id);

  const activeJobs = await JobRequest.aggregate([
    { $match: { workerId: workerId, status: "accepted" } },
    {
      $lookup: {
        from: "users",
        localField: "clientId",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    { $unwind: "$userDetails" },
    {
      $lookup: {
        from: "clientprofiles",
        localField: "clientId",
        foreignField: "userId",
        as: "clientProfileData"
      }
    },
    { $unwind: { path: "$clientProfileData", preserveNullAndEmptyArrays: true } },
    { $sort: { scheduledDate: 1 } },
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
          profilePic: { $ifNull: ["$clientProfileData.profilePic", "$userDetails.profilePic"] },
          phone: { $ifNull: ["$clientProfileData.phone", "$userDetails.phone"] },
          city: "$clientProfileData.city"
        }
      }
    }
  ]);

  res.json(activeJobs);
});

/* ================= GET CLIENT REQUESTS (Client View) ================= */
exports.getClientRequests = asyncHandler(async (req, res) => {
  const clientId = new mongoose.Types.ObjectId(req.user._id);
  const { status } = req.query;

  const matchQuery = { clientId: clientId };
  if (status) matchQuery.status = status;

  const requests = await JobRequest.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "workerId",
        foreignField: "_id",
        as: "workerUser"
      }
    },
    { $unwind: "$workerUser" },
    {
      $lookup: {
        from: "workerprofiles",
        localField: "workerId",
        foreignField: "userId",
        as: "workerProfile"
      }
    },
    { $unwind: { path: "$workerProfile", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        address: 1,
        status: 1,
        scheduledDate: 1,
        createdAt: 1,
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
});

/* ================= SIMPLE QUERIES ================= */
exports.getWorkerPendingRequests = asyncHandler(async (req, res) => {
  const workerId = req.user._id;
  const requests = await JobRequest.find({ workerId, status: "pending" })
    .populate("clientId", "name email profilePic")
    .sort({ createdAt: -1 });
  res.json(requests);
});

exports.getWorkerCompletedJobs = asyncHandler(async (req, res) => {
  const workerId = req.user._id;
  const completedJobs = await JobRequest.find({ workerId, status: "completed" })
    .sort({ updatedAt: -1 });
  res.json(completedJobs);
});

exports.getAllWorkerRequests = asyncHandler(async (req, res) => {
  const workerId = new mongoose.Types.ObjectId(req.user._id);
  
  const requests = await JobRequest.aggregate([
    { $match: { workerId: workerId } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: { from: "users", localField: "clientId", foreignField: "_id", as: "clientUser" }
    },
    { $unwind: "$clientUser" },
    {
      $lookup: { from: "clientprofiles", localField: "clientId", foreignField: "userId", as: "clientProfile" }
    },
    { $unwind: { path: "$clientProfile", preserveNullAndEmptyArrays: true } },
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
          profilePic: { $ifNull: ["$clientProfile.profilePic", "$clientUser.profilePic"] }
        }
      }
    }
  ]);

  res.json(requests);
});