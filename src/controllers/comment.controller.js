const Comment = require("../model/comment"); // Adjust path if needed
const Post = require("../model/posts"); // To check if post exists

// 1. Add a Comment
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create the comment
    const newComment = await Comment.create({
      postId,
      userId: req.user._id, // From auth middleware
      text,
    });

    // Populate user details immediately so frontend can display it
    await newComment.populate("userId", "name role profile profilePic");

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Get Comments for a Post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .populate("userId", "name role profile profilePic") // Get author details
      .sort({ createdAt: -1 }); // Newest first

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Delete a Comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check ownership: Only the comment author can delete it
    // (Optional: Allow the Post author to delete comments too if you want)
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};