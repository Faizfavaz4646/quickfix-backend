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