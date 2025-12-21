const express = require("express");
const clientProfileRouter =express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware")
const clientProfileSchema = require("../utils/validation");
const clientProfileController = require("../controllers/clientProfile.controller")


clientProfileRouter.post(
    "/profile",
    userAuth,
    roleAuth(["client"]),
    validate(clientProfileSchema),
    clientProfileController.upsertClientProfile
);
module.exports = clientProfileRouter;