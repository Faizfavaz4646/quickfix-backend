const express = require("express");
const workerProfileRouter =express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const workerProfileSchema = require("../utils/validation");
const workerProfileController = require("../controllers/workerProfile.controller");


workerProfileRouter.patch(
  "/profile",
  userAuth,
  roleAuth(["worker"]),
  validate(workerProfileSchema.clientProfileSchema),
  workerProfileController.upsertWorkerProfile
);

workerProfileRouter.get(
  "/profile",
  userAuth,
  roleAuth(["worker"]),
  workerProfileController.getWorkerProfile
);

module.exports =workerProfileRouter;
