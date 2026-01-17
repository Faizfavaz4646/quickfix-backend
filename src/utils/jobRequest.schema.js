const Joi = require("joi");

exports.createJobRequestSchema = Joi.object({
  workerId: Joi.string()
    .hex()
    .length(24)
    .required(),

  title: Joi.string()
    .min(3)
    .max(100)
    .required(),

  description: Joi.string()
    .min(10)
    .max(1000)
    .required(),

  address: Joi.string()
    .min(5)
    .max(255)
    .required(),

  city: Joi.string()
    .max(100)
    .allow("", null),

  state: Joi.string()
    .max(100)
    .allow("", null),

  scheduledDate: Joi.date()
    .greater("now")
    .required(),

  clientPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
});
exports.updateJobStatusSchema = Joi.object({
  status: Joi.string()
    .valid("accepted", "rejected", "cancelled", "completed")
    .required(),
});

