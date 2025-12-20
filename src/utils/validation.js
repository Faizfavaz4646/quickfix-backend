const Joi = require("joi");

/* ================= SIGNUP ================= */
const signupSchema = Joi.object({
  name: Joi.string().min(4).max(16).required(),
  emailId: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(64).required(),
  role: Joi.string().valid("client", "worker").required(),
});

/* ================= LOGIN ================= */
const loginSchema = Joi.object({
  emailId: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

/* ================= CLIENT PROFILE ================= */
const clientProfileSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10}$/).allow(""),
  gender: Joi.string().valid("male", "female", "").allow(""),
  state: Joi.string().allow(""),
  district: Joi.string().allow(""),
  city: Joi.string().allow(""),
  zip: Joi.string().length(6).allow(""),
  profilePic: Joi.string().uri().allow("", null),

  requests: Joi.array().items(Joi.object().unknown(true)),
  completedJobs: Joi.array().items(Joi.object().unknown(true)),
  activeJobs: Joi.array().items(Joi.object().unknown(true)),

  notifications: Joi.array().items(Joi.string()),
  ratings: Joi.array().items(Joi.number()),
  reviews: Joi.array().items(Joi.string()),

  preferences: Joi.object().unknown(true),
}).unknown(false);

/* ================= WORKER PROFILE ================= */
const workerProfileSchema = Joi.object({
  profession: Joi.string().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  gender: Joi.string().valid("male", "female").required(),
  state: Joi.string().required(),
  district: Joi.string().required(),
  city: Joi.string().required(),
  zip: Joi.string().length(6).required(),
  schedule: Joi.string().required(),
  profilePic: Joi.string().uri().allow("", null),

  skills: Joi.array().items(Joi.string()),
  previousWorkImages: Joi.array().items(Joi.string()),

  requests: Joi.array().items(Joi.object().unknown(true)),
  activeJobs: Joi.array().items(Joi.object().unknown(true)),
  completedJobs: Joi.array().items(Joi.object().unknown(true)),

  notifications: Joi.array().items(Joi.string()),
  ratings: Joi.array().items(Joi.number()),
  reviews: Joi.array().items(Joi.string()),
}).unknown(false);

module.exports = {
  signupSchema,
  loginSchema,
  clientProfileSchema,
  workerProfileSchema,
};
