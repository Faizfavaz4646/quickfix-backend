const mongoose = require("mongoose");
const Review = require("../model/review");
const WorkerProfile = require("../model/workerProfile");

exports.createReview = async (req, res) => {
  try {
    const { jobId, workerId, rating, comment } = req.body;
    const clientId = req.user._id;

    // 1. Create the Review
    const newReview = await Review.create({
      jobId,
      clientId,
      workerId, // This refers to the Worker's User ID
      rating,
      comment
    });

    // 2. Calculate New Stats (Average & Count)
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

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error("Review Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ message: "You have already reviewed this job." });
    }
    res.status(500).json({ message: "Failed to submit review" });
  }
};