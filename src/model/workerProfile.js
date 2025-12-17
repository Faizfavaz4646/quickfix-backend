const mongoose = require("mongoose");

const workerProfileSchema = new mongoose.Schema({

    userId :{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true,
        unique: true,
        index:true,
    },
    profession :{
        type:String,
        required: true,
        trim:true,
    },

    phone:{
        type:String,
        required: true,
    },

    gender: {
        type:String,
        required: true,
        enum:["male","female","other"],
    },

    state: String,
    district: String,
    city: String,

    zip: {
        type:String,
        maxlength:6,

    },

    schedule : {
        type:String,

    },

    profilePic: {
        type:String,

    },
    previousWorkImages : [
        {
        type: String,
      },
],
    requests :[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref : "JobRequest",
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


    notifications: [
      {
        message: String,
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

     ratings: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        value: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],

      reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

     termsAccepted: {
      type: Boolean,
      required: true,
    },


},
{timestamps: true}
);
module.exports =mongoose.model("WorkerProfile", workerProfileSchema)