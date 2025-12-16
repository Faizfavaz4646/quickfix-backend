// models/ClientProfile.js
const mongoose = require("mongoose");

const clientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  phone: { type: String, default: "" },
  gender: { type: String, enum: ["male", "female", ""], default: "" },
  state: { type: String, default: "" },
  district: { type: String, default: "" },
  city: { type: String, default: "" },
  zip: { type: String, maxlength: 6, default: "" },
  profilePic: { type: String, default: "" },

  // Job / requests related
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "JobRequest" }],
  completedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  activeJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],

  // Notifications & feedback
  notifications: [{ type: String }],
  ratings: [{ type: Number }],
  reviews: [{ type: String }],

  // Optional future-proof field
  preferences: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("ClientProfile", clientProfileSchema);
