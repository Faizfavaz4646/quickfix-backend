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
  activeJobs: Joi.array().items(Joi.object().unknown(true)),
  completedJobs: Joi.array().items(Joi.object().unknown(true)),

  notifications: Joi.array().items(Joi.string()),
  ratings: Joi.array().items(Joi.number()),
  reviews: Joi.array().items(Joi.string()),

  preferences: Joi.object().unknown(true),
}).unknown(false);

const clientProfilePatchSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  gender: Joi.string().valid("male", "female"),
  state: Joi.string(),
  district: Joi.string(),
  city: Joi.string(),
  zip: Joi.string().length(6),
  profilePic: Joi.string().uri().allow("", null),
  preferences: Joi.object().unknown(true),
})
  .min(1)
  .unknown(false);

/* ================= WORKER PROFILE ================= */
/**
 * Combined schema for creating or updating a worker profile
 * - For creation: frontend must send all required fields
 * - For update: any subset of fields is allowed
 */
const upsertWorkerProfileSchema = Joi.object({
 FullName: Joi.string().length(20),
  profession: Joi.string().min(2),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  gender: Joi.string().valid("male", "female", "other"),
  state: Joi.string(),
  district: Joi.string(),
  city: Joi.string(),
  zip: Joi.string().length(6),
  schedule: Joi.string(),
  profilePic: Joi.string().uri().allow("", null),

  previousWorkImages: Joi.array().items(Joi.string().uri()),

  requests: Joi.array().items(Joi.object().unknown(true)),
  activeJobs: Joi.array().items(Joi.object().unknown(true)),
  completedJobs: Joi.array().items(Joi.object().unknown(true)),

  notifications: Joi.array().items(Joi.string()),
  ratings: Joi.array().items(Joi.number()),
  reviews: Joi.array().items(Joi.string()),
})
  .min(1) // must send at least one field
  .unknown(false);

module.exports = {
  signupSchema,
  loginSchema,
  clientProfileSchema,
  clientProfilePatchSchema,
  upsertWorkerProfileSchema,
};
