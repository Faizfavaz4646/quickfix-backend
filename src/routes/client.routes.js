const express = require("express");
const clientProfileRouter =express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware")
const {clientProfilePatchSchema} = require("../utils/validation");
const clientProfileController = require("../controllers/clientProfile.controller")


clientProfileRouter.patch(
    "/profile",
    userAuth,
    roleAuth(["client"]),
    validate(clientProfilePatchSchema),
    clientProfileController.upsertClientProfile
);
clientProfileRouter.get(
  "/profile",
  userAuth,
  roleAuth(["client"]),
  clientProfileController.getClientProfile
);

module.exports = clientProfileRouter;