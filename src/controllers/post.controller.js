const Post = require("../model/posts");
const User = require("../model/user");
const ClientProfile = require("../model/clientProfile");
const WorkerProfile = require("../model/workerProfile");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Helper: Fetches profile picture across collections
 */
const getAuthorImage = async (userId, role) => {
  if (role === "client") {
    const profile = await ClientProfile.findOne({ userId });
    return profile ? profile.profilePic : null;
  } 
  if (role === "worker") {
    const profile = await WorkerProfile.findOne({ userId });
    return profile ? profile.profilePic : null;
  }
  return null;
};

/* ================= CREATE POST ================= */
exports.createPost = asyncHandler(async (req, res) => {
  // 1. Create the post
  const newPost = await Post.create({
    authorId: req.user._id,
    authorRole: req.user.role,
    ...req.body,
  });

  // 2. Populate basic user info
  const populatedPost = await Post.findById(newPost._id)
    .populate("authorId", "name role")
    .lean();

  // 3. Get profile picture
  const profilePic = await getAuthorImage(req.user._id, req.user.role);

  // 4. Construct final response
  const finalPost = {
    ...populatedPost,
    authorId: {
      ...populatedPost.authorId,
      profilePic: profilePic
    }
  };

  res.status(201).json(finalPost);
});

/* ================= GET GENERAL FEED ================= */
exports.getFeed = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("authorId", "name role profilePic") 
    .sort({ createdAt: -1 })
    .lean();

  const postsWithImages = await Promise.all(
    posts.map(async (post) => {
      if (!post.authorId) return post;

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
});

/* ================= TOGGLE LIKE ================= */
exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
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
});

/* ================= UPDATE POST ================= */
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, authorId: req.user._id });
  
  if (!post) {
    const error = new Error("Unauthorized edit attempt or post not found");
    error.statusCode = 403;
    throw error;
  }
  
  // Time Guard: Edit window (60 minutes)
  const minutesSinceCreation = (Date.now() - new Date(post.createdAt).getTime()) / 60000;
  if (minutesSinceCreation > 60) {
    const error = new Error("Edit window (60m) has expired");
    error.statusCode = 400;
    throw error;
  }

  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});

/* ================= DELETE POST ================= */
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findOneAndDelete({ 
    _id: req.params.id, 
    authorId: req.user._id 
  });
  
  if (!post) {
    const error = new Error("Unauthorized delete attempt or post not found");
    error.statusCode = 403;
    throw error;
  }
  
  res.json({ message: "Post deleted successfully" });
});

/* ================= GET MY POSTS ================= */
exports.getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ authorId: req.user._id })
    .populate("authorId", "name role email") 
    .sort({ createdAt: -1 })
    .lean();

  const formattedPosts = await Promise.all(
    posts.map(async (post) => {
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
});