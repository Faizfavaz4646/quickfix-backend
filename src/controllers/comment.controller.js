const Comment = require("../model/comment");
const Post = require("../model/posts"); 
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");

// Internal helper remains the same logic-wise
async function getProfilePic(userId, role) {
  let profile = null;
  if (role === "client") {
    profile = await mongoose.model("ClientProfile").findOne({ userId: userId });
  } else if (role === "worker") {
    profile = await mongoose.model("WorkerProfile").findOne({ userId: userId });
  }
  return profile?.profilePic || null;
}

// 1. Add a Comment
// Wrapped in asyncHandler to remove try-catch
exports.addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error; // Caught by Global Error Handler
  }

  const newComment = await Comment.create({
    postId,
    userId: req.user._id, 
    text,
  });

  const profilePic = await getProfilePic(req.user._id, req.user.role);

  const responseComment = {
    ...newComment.toObject(),
    userId: {
      _id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      profilePic: profilePic 
    }
  };

  res.status(201).json(responseComment);
});

// 2. Get Comments for a Post
exports.getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ postId })
    .sort({ createdAt: -1 })
    .populate("userId", "name role") 
    .lean();

  const commentsWithPics = await Promise.all(
    comments.map(async (comment) => {
      const user = comment.userId;
      if (!user) return comment;

      const profilePic = await getProfilePic(user._id, user.role);

      return {
        ...comment,
        userId: {
          ...user,
          profilePic: profilePic 
        }
      };
    })
  );

  res.json(commentsWithPics);
});

// 3. Delete a Comment
exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  // Permission check
  if (comment.userId.toString() !== req.user._id.toString()) {
    const error = new Error("Not allowed to delete this comment");
    error.statusCode = 403;
    throw error;
  }

  await comment.deleteOne();
  res.json({ message: "Comment deleted" });
});