const express = require("express");
const router = express.Router();
const userAuth = require("../middlewares/auth.middleware");
const reviewController = require("../controllers/review.controller");

router.post("/", userAuth, reviewController.createReview);
router.get("/worker/:workerId", reviewController.getReviewsByWorkerId);

module.exports = router;