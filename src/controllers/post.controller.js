const Post = require("../model/posts");

exports.createPost = async (req, res) => {
  try {
    const post = await Post.create({
      authorId: req.user._id,
      authorRole: req.user.role,
      ...req.body,
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👇 THIS IS THE KEY UPDATE
exports.getFeed = async (req, res) => {
  try {
    // 1. Simple populate (Grabs ALL user fields to prevent missing data)
    const posts = await Post.find()
      .populate("authorId") 
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("❌ Feed Error:", err); // This prints the real error in your VS Code terminal
    res.status(500).json({ message: "Server error fetching feed" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const userId = req.user._id;
    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      authorId: req.user._id,
    });
    
    if (!post) {
      return res.status(403).json({ message: "Not allowed" });
    }
    
    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      authorId: req.user._id,
    });
    if (!post) {
      return res.status(403).json({ message: "Not allowed" });
    }
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};