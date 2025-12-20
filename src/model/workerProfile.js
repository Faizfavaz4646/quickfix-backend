const mongoose = require("mongoose");

const workerProfileSchema = new mongoose.Schema(
  {
  
    // RELATION
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    profession: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, 
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    state: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    zip: {
      type: String,
      match: /^[0-9]{6}$/, 
    },


    // WORK DETAILS
    
    schedule: {
      type: String,
      trim: true,
    },

    profilePic: {
      type: String,
    },

    previousWorkImages: [
      {
        type: String,
      },
    ],

  
    // JOB FLOW

    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobRequest",
      },
    ],

    activeJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],

    completedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],

  
    // NOTIFICATIONS
 
    notifications: [
      {
        message: {
          type: String,
          required: true,
        },
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],


    // RATINGS & REVIEWS
  
    ratings: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        value: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
      },
    ],

    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkerProfile", workerProfileSchema);
