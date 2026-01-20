const User = require("../model/user");
const Post = require("../model/posts");
const JobRequest = require("../model/jobRequests");

/* ================= USERS ================= */

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent blocking admin
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot block admin" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= POSTS ================= */

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("authorId", "name role");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post removed by admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= STATS ================= */

exports.getStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const posts = await Post.countDocuments();
    const jobs = await JobRequest.countDocuments();

    res.json({ users, posts, jobs });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
