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

/* ================= CLIENT ROUTES ================= */

// 1. Create Request (Client)
router.post(
    "/",
    userAuth,
    roleAuth(["client"]),
    validate(createJobRequestSchema),
    jobRequestController.createJobRequest
);

//  2. Get All Client Requests (History/Pending) - NEW ROUTE
router.get(
    "/client/all",
    userAuth,
    roleAuth(["client"]),
    jobRequestController.getClientRequests
);


/* ================= WORKER ROUTES ================= */

// 3. Get Active Jobs
router.get(
    "/worker/active",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getWorkerActiveJobs
);

// 4. Get Completed Jobs
router.get(
    "/worker/completed",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getWorkerCompletedJobs
);

// 5. Get Pending Requests (Only Pending)
router.get(
    "/worker/pending",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getWorkerPendingRequests
);

// 6. Get ALL Requests (Pending, History, etc.)
router.get(
    "/worker/all",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getAllWorkerRequests
);


/* ================= SHARED / DYNAMIC ROUTES ================= */
// NOTE: Dynamic routes like /:id must be LAST to avoid matching specific paths

// 7. Update Status (Worker)
router.patch(
    "/:id/status",
    userAuth,
    roleAuth(["worker"]),
    validate(updateJobStatusSchema),
    jobRequestController.updateJobStatus
);

module.exports = router;