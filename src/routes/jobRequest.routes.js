const express =require("express");
const router = express.Router();

const userAuth =require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const {
    createJobRequestSchema,
    updateJobStatusSchema,
}=require("../utils/jobRequest.schema");

const jobRequestController= require("../controllers/jobRequest.controller");


//client create job requests

router.post(
    "/",
    userAuth,
    roleAuth(["client"]),
    validate(createJobRequestSchema),
    jobRequestController.createJobRequest
);

//worker sees incoming requests

router.get(
    "/worker",
    userAuth,
    roleAuth(["worker"]),
    jobRequestController.getWorkerRequests

);

// client sees their sent requests

router.get(
    "/client",
    userAuth,
    roleAuth(["client"]),
    jobRequestController.getClientRequests
);

//update job requests

router.patch(
    "/:id/status",
    userAuth,
    validate(updateJobStatusSchema),
    jobRequestController.updateJobStatus
)

module.exports =router;