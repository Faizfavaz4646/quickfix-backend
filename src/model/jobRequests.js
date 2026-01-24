const mongoose = require("mongoose");

const jobRequestsSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // ✅ Ensure these are listed ONLY ONCE
    title: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    state: String,
    scheduledDate: Date,

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    clientPhone: String,
    workerPhone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobRequest", jobRequestsSchema);