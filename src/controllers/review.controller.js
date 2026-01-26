const mongoose = require("mongoose"); // 👈 THIS WAS MISSING
const Review = require("../model/review");
const User = require("../model/user"); 

exports.createReview = async (req, res) => {
  try {
    const { jobId, workerId, rating, comment } = req.body;
    const clientId = req.user._id;

    // 1. Create the Review
    const newReview = await Review.create({
      jobId,
      clientId,
      workerId,
      rating,
      comment
    });

    // 2. Calculate New Average (Aggregation Pipeline)
    // Now this line will work because we imported mongoose!
    const stats = await Review.aggregate([
      { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
      {
        $group: {
          _id: "$workerId",
          avgRating: { $avg: "$rating" },
          nRating: { $sum: 1 }
        }
      }
    ]);

    // 3. Update Worker User with new stats
    if (stats.length > 0) {
      await User.findByIdAndUpdate(workerId, {
        averageRating: stats[0].avgRating.toFixed(1), // e.g., "4.5"
        totalReviews: stats[0].nRating
      });
    }

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error("Review Error:", error);
    // If it's a duplicate review, send a 400 (Bad Request) instead of 500
    if (error.code === 11000) {
        return res.status(400).json({ message: "You have already reviewed this job." });
    }
    res.status(500).json({ message: "Failed to submit review" });
  }
};