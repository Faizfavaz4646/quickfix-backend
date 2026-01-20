const express = require("express");
const router = express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const { upsertWorkerProfileSchema } = require("../utils/validation");
const workerProfileController = require("../controllers/workerProfile.controller");

/**
 * PUBLIC ROUTES (NO AUTH)
 */
router.get("/search", workerProfileController.searchWorkers);

/**
 * AUTHENTICATED WORKER ROUTES
 */
router.get(
  "/me",
  userAuth,
  roleAuth(["worker"]),
  workerProfileController.getWorkerProfile
);

// Single endpoint for create or update (upsert)
router.post(
  "/upsert",
  userAuth,
  roleAuth(["worker"]),
  validate(upsertWorkerProfileSchema),
  workerProfileController.upsertWorkerProfile
);
router.patch(
  "/upsert", 
  userAuth,
  roleAuth(["worker"]),
  validate(upsertWorkerProfileSchema),
  workerProfileController.upsertWorkerProfile
);

/**
 * PUBLIC – MUST BE LAST
 */
router.get("/:id", workerProfileController.getWorkerProfileById);

module.exports = router;
