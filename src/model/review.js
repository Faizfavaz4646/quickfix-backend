const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobRequest", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
}, { timestamps: true });

// Prevent duplicate reviews for the same job
reviewSchema.index({ jobId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);