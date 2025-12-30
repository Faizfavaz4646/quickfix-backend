const express = require("express");
const router = express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const { workerProfilePatchSchema } = require("../utils/validation");
const workerProfileController = require("../controllers/workerProfile.controller");

router.patch(
  "/profile",
  userAuth,
  roleAuth(["worker"]),
  validate(workerProfilePatchSchema),
  workerProfileController.upsertWorkerProfile
);

router.get(
  "/profile",
  userAuth,
  roleAuth(["worker"]),
  workerProfileController.getWorkerProfile
);

module.exports = router;
