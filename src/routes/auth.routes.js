const express = require("express");
const authRouter =express.Router();

const authController =require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const {signupSchema,loginSchema}=require("../utils/validation");
const userAuth = require("../middlewares/auth.middleware");

authRouter.post("/signup",validate(signupSchema),authController.signup);
authRouter.post("/login",validate(loginSchema),authController.login);
authRouter.post("/logout",authController.logout);
authRouter.patch("/change-password", userAuth, authController.changePassword);

module.exports =authRouter;