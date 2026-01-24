const express = require("express");
const router = express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const {
    createJobRequestSchema,
    updateJobStatusSchema,
} = require("../utils/jobRequest.schema");

const jobRequestController = require("../controllers/jobRequest.controller");

// 1. Create Request (Client)
router.post(
    "/",
    userAuth,
    roleAuth(["client"]),
    validate(createJobRequestSchema),
    jobRequestController.createJobRequest
);

// 2. Get Active Jobs (Worker) - NEW ROUTE ADDED HERE
// This must be defined before /:id routes
router.get(
    "/worker/active",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getWorkerActiveJobs
);

// 3. Get Pending Requests (Worker)
router.get(
    "/worker/pending",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getWorkerPendingRequests
);

// 4. Update Status (Worker)
router.patch(
    "/:id/status",
    userAuth,
    roleAuth(["worker"]),
    validate(updateJobStatusSchema),
    jobRequestController.updateJobStatus
);

module.exports = router;