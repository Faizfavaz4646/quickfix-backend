const express = require("express");
const authRouter =express.Router();

const authController =require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const {signupSchema,loginSchema}=require("../utils/validation");

authRouter.post("/signup",validate(signupSchema),authController.signup);
authRouter.post("/login",validate(signupSchema),authController.login);
authRouter.post("/logout",authController.signup);

module.exports =authRouter;