const Comment = require("../model/comment"); // Ensure path is correct
const Post = require("../model/posts"); 
const mongoose = require("mongoose");

// Helper function to find profile picture
async function getProfilePic(userId, role) {
  try {
    let profile = null;
    if (role === "client") {
      profile = await mongoose.model("ClientProfile").findOne({ userId: userId });
    } else if (role === "worker") {
      profile = await mongoose.model("WorkerProfile").findOne({ userId: userId });
    }
    return profile?.profilePic || null;
  } catch (err) {
    console.error("Error fetching profile pic:", err);
    return null;
  }
}

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
      userId: req.user._id, 
      text,
    });

    // Fetch the specific profile picture for the logged-in user
    const profilePic = await getProfilePic(req.user._id, req.user.role);

    // Construct response manually to ensure frontend gets the image immediately
    const responseComment = {
      ...newComment.toObject(),
      userId: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        profilePic: profilePic // ✅ Sending the image explicitly
      }
    };

    res.status(201).json(responseComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Get Comments for a Post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // 1. Get plain comments with basic user info
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .populate("userId", "name role") 
      .lean();

    // 2. Manually fetch profile pictures for each comment author
    const commentsWithPics = await Promise.all(
      comments.map(async (comment) => {
        const user = comment.userId;
        
        // Handle case where user might be deleted
        if (!user) return comment;

        // Fetch pic based on role
        const profilePic = await getProfilePic(user._id, user.role);

        return {
          ...comment,
          userId: {
            ...user,
            profilePic: profilePic // ✅ Attach the found picture
          }
        };
      })
    );

    res.json(commentsWithPics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Delete a Comment (No changes needed here)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

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