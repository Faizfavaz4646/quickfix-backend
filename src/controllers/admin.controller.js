const User = require("../model/user");
const Post = require("../model/posts");
const JobRequest = require("../model/jobRequests");
const asyncHandler = require("../utils/asyncHandler");

/* ================= USERS ================= */

// ✅ Wrapped in asyncHandler to remove try-catch
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

exports.toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  // ✅ You can now throw errors directly to the Global Handler
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  
  if (user.role === "admin") {
    const error = new Error("Cannot block admin");
    error.statusCode = 403;
    throw error;
  }

  // Update 'status' field
  user.status = user.status === "active" ? "blocked" : "active";
  await user.save();

  res.json({
    message: `User is now ${user.status}`,
  });
});

/* ================= POSTS ================= */

exports.getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find().populate("authorId", "name role");
  res.json(posts);
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ message: "Post removed by admin" });
});

/* ================= STATS ================= */

exports.getStats = asyncHandler(async (req, res) => {
  // Efficiently count documents
  const users = await User.countDocuments();
  const posts = await Post.countDocuments();
  const jobs = await JobRequest.countDocuments();

  res.json({ users, posts, jobs });
});