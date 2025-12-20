

const Joi = require("joi");

/* signup */

const signupSchema = Joi.object({
  name:Joi.string().min(4).max(16).required(),

  emailId: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(64).required(),
  role: Joi.string().valid("client","worker").required()
});

/* Login */

const loginSchema = Joi.object({
  emailId : Joi.string().email().lowercase().required(),
  password :Joi.string().required()
});

/* ClientProfile */

const clientProfileSchema = Joi.object({
  phone : Joi.string().allow(""),
  gender : Joi.string().valid("male","female","").allow(""),
  state : Joi.string().allow(""),
  district :Joi.string().allow(""),
  city :Joi.string().allow(""),
  zip :Joi.string().length(6).allow(""),
  profilePic : Joi.string().uri().allow(""),



  requests : Joi.array().items(Joi.string()),
  completedJobs : Joi.array().items(Joi.string()),
  activeJobs : Joi.array().items(Joi.string()),



   notifications: Joi.array().items(Joi.string()),
  ratings: Joi.array().items(Joi.number()),
  reviews: Joi.array().items(Joi.string()),


   preferences: Joi.object().unknown(true),

}).unknown(false);

/* workerProfile */


const workerProfileSchema = Joi.object({
  profession : Joi.string().required(),
  phone : Joi.string().required(),
  gender : Joi.string().valid("male","female").required(),
  state : Joi.string().required(),
  district : Joi.string().required(),
  city: Joi.string().required(),
  zip : Joi.string().length(6).required(),
  schedule : Joi.string().required(),
  profilePic : Joi.string().uri().allow(""),

  skills : Joi.string().items(Joi.string()),
  previousWorkImages : Joi.string().items(Joi.string()),

  requests : Joi.string().items(Joi.string()),
  activeJobs : Joi.string().items(Joi.string()),
  completedJobs : Joi.string().items(Joi.string()),

    notifications: Joi.array().items(Joi.string()),
  ratings: Joi.array().items(Joi.number()),
  reviews: Joi.array().items(Joi.string()),


}).unknown(false);

module.exports ={
  signupSchema,
  loginSchema,
  clientProfileSchema,
  workerProfileSchema,
};