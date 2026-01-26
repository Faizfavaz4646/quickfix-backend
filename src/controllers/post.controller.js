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

exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      // ✅ FIX IS HERE: Added "profile" and "profilePic" to the select string
      .populate("authorId", "name role profile profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Feed Error:", err);
    res.status(500).json({ message: "Server error" });
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
    // Note: ensure req.params.id is used to find the post, and authorId checks ownership
    const post = await Post.findOne({
      _id: req.params.id, // Fixed: Changed from req.user.id (which is likely wrong) to req.params.id
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