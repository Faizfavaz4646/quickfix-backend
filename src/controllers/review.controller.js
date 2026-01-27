const mongoose = require("mongoose");
const Review = require("../model/review");
const WorkerProfile = require("../model/workerProfile");
const asyncHandler = require("../utils/asyncHandler");

exports.createReview = asyncHandler(async (req, res) => {
  const { jobId, workerId, rating, comment } = req.body;
  const clientId = req.user._id;

  // 1. Create the Review
  // Note: Mongoose unique index on jobId + clientId will handle duplicate prevention
  const newReview = await Review.create({
    jobId,
    clientId,
    workerId, // This refers to the Worker's User ID
    rating,
    comment
  });

  // 2. Calculate New Stats (Average & Count) using Aggregation
  const stats = await Review.aggregate([
    // Match all reviews for this worker
    { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
    // Group to calculate average and total count
    {
      $group: {
        _id: "$workerId",
        avgRating: { $avg: "$rating" },
        nRating: { $sum: 1 }
      }
    }
  ]);

  // 3. Update WorkerProfile with the new stats
  if (stats.length > 0) {
    await WorkerProfile.findOneAndUpdate(
      { userId: workerId }, // Find profile by User ID
      {
        averageRating: parseFloat(stats[0].avgRating.toFixed(1)), // Save as number (e.g. 4.5)
        totalReviews: stats[0].nRating
      }
    );
  }

  res.status(201).json({ 
    success: true,
    message: "Review submitted successfully", 
    review: newReview 
  });
});
exports.getReviewsByWorkerId = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const reviews = await Review.aggregate([
    // 1. Find reviews for this worker
    { 
      $match: { 
        workerId: new mongoose.Types.ObjectId(workerId) 
      } 
    },
    
    // 2. Sort Newest First
    { $sort: { createdAt: -1 } },

    // 3. LOOKUP 1: Get User Name from 'users' collection
    {
      $lookup: {
        from: "users",          // Collection name for Users
        localField: "clientId",
        foreignField: "_id",
        as: "userDoc"
      }
    },
    { $unwind: "$userDoc" },    // Flatten the array

    // 4. LOOKUP 2: Get Profile Pic from 'clientprofiles' collection
    // ⚠️ CRITICAL: Ensure 'clientprofiles' matches your actual MongoDB collection name
    {
      $lookup: {
        from: "clientprofiles", // The collection where the image lives
        localField: "clientId", // The User ID in the review
        foreignField: "userId", // The User ID in the profile
        as: "profileDoc"
      }
    },
    // We use preserveNullAndEmptyArrays in case a profile hasn't been created yet
    {
      $unwind: {
        path: "$profileDoc",
        preserveNullAndEmptyArrays: true
      }
    },

    // 5. PROJECT: Shape the data exactly how the Frontend expects it
    {
      $project: {
        _id: 1,
        rating: 1,
        // Handle both 'comment' and 'review' field names just in case
        comment: { $ifNull: ["$comment", "$review"] },
        createdAt: 1,
        clientId: {
          _id: "$userDoc._id",
          name: "$userDoc.name",
          // Priority: 1. ClientProfile Pic, 2. User Pic, 3. Null
          profilePic: { $ifNull: ["$profileDoc.profilePic", "$userDoc.profilePic"] }
        }
      }
    }
  ]);

  res.status(200).json(reviews);
});