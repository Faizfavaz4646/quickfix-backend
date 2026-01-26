const Post = require("../model/posts");
const User = require("../model/user");
const ClientProfile = require("../model/clientProfile");
const WorkerProfile = require("../model/workerProfile");

/**
 * Robust Helper: Fetches profile picture across collections
 * This ensures that regardless of model registration order, the 
 * correct profile is queried based on the author's role.
 */
const getAuthorImage = async (userId, role) => {
  try {
    if (role === "client") {
      const profile = await ClientProfile.findOne({ userId });
      return profile ? profile.profilePic : null;
    } 
    if (role === "worker") {
      const profile = await WorkerProfile.findOne({ userId });
      return profile ? profile.profilePic : null;
    }
    return null;
  } catch (err) {
    console.error(`Failed to fetch image for ${role} ${userId}:`, err);
    return null;
  }
};

/* ================= CREATE POST ================= */
exports.createPost = async (req, res) => {
  try {
    // 1. Create the post
    const newPost = await Post.create({
      authorId: req.user._id,
      authorRole: req.user.role,
      ...req.body,
    });

    // 2. Populate the basic user info (name, role)
    // We use .execPopulate() or findById depending on your Mongoose version
    const populatedPost = await Post.findById(newPost._id)
      .populate("authorId", "name role")
      .lean();

    // 3. Get the profile picture using your helper function
    // (Ensure fetchProfilePic is defined in this file as we did before)
    const profilePic = await fetchProfilePic(req.user._id, req.user.role);

    // 4. Construct the final object so the frontend sees the image instantly
    const finalPost = {
      ...populatedPost,
      authorId: {
        ...populatedPost.authorId,
        profilePic: profilePic
      }
    };

    res.status(201).json(finalPost);
  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

/* ================= GET GENERAL FEED ================= */
exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("authorId", "name role profilePic") // First attempt to get User-level pic
      .sort({ createdAt: -1 })
      .lean();

    const postsWithImages = await Promise.all(
      posts.map(async (post) => {
        if (!post.authorId) return post;

        // If User model pic is missing (common for workers), check Profile collections
        let finalPic = post.authorId.profilePic; 
        if (!finalPic) {
          finalPic = await getAuthorImage(post.authorId._id, post.authorId.role);
        }

        return {
          ...post,
          authorId: {
            ...post.authorId,
            profilePic: finalPic
          }
        };
      })
    );

    res.json(postsWithImages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching feed" });
  }
};

/* ================= GET MY POSTS ================= */
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.user._id })
      .populate("authorId", "name role email") 
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Resolve own profile pic based on current logged-in role
        const profilePic = await getAuthorImage(req.user._id, req.user.role);

        return {
          ...post,
          authorId: {
            ...post.authorId,
            profilePic: profilePic
          }
        };
      })
    );

    res.json(formattedPosts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching your posts" });
  }
};

/* ================= TOGGLE LIKE ================= */
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

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

/* ================= UPDATE POST ================= */
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, authorId: req.user._id });
    
    if (!post) return res.status(403).json({ message: "Unauthorized edit attempt" });
    
    // Time Guard: LinkedIn/Instagram style limit (60 minutes)
    const minutesSinceCreation = (Date.now() - new Date(post.createdAt).getTime()) / 60000;
    if (minutesSinceCreation > 60) {
      return res.status(400).json({ message: "Edit window (60m) has expired" });
    }

    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE POST ================= */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ 
      _id: req.params.id, 
      authorId: req.user._id 
    });
    
    if (!post) return res.status(403).json({ message: "Unauthorized delete attempt" });
    
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};