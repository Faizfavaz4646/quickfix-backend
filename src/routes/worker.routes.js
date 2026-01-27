const express = require("express");
const router = express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const { upsertWorkerProfileSchema } = require("../utils/validation");
const workerProfileController = require("../controllers/workerProfile.controller");

/**
 * ==========================================
 * PUBLIC ROUTES (NO AUTH REQUIRED)
 * ==========================================
 */

// 1. Search Workers (by profession/location)
router.get("/search", workerProfileController.searchWorkers);

// 2. ✅ NEW ROUTE: Top Rated Workers
// (MUST be before /:id so "top" isn't treated as an ID)
router.get("/top", workerProfileController.getTopWorkers);

/**
 * ==========================================
 * AUTHENTICATED WORKER ROUTES
 * ==========================================
 */

// Get Logged-in Worker's Profile
router.get(
  "/me",
  userAuth,
  roleAuth(["worker"]),
  workerProfileController.getWorkerProfile
);

// Create or Update (Upsert) Profile
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
 * ==========================================
 * GENERIC GET ROUTES (MUST BE AT THE BOTTOM)
 * ==========================================
 */

// Handle "GET /workers?userId=..." query
router.get("/", workerProfileController.getWorkerByUserIdParam);

// Handle "GET /workers/:id" (Get by Profile ID or User ID)
// ⚠️ This matches anything like /workers/123, so it must be LAST
router.get("/:id", workerProfileController.getWorkerProfileById);

module.exports = router;