const express = require("express");
const userAuth = require("../middlewares/auth.middleware");
const { 
    createPost, 
    getFeed, 
    updatePost, 
    deletePost, 
    toggleLike, 
    getMyPosts
} = require("../controllers/post.controller");

const router = express.Router();

// 1. Create & Get (No ID needed)
router.post("/", userAuth, createPost);
router.get("/", userAuth, getFeed);

router.get("/me",userAuth,getMyPosts)

// 2. Update Post (Needs ID)
// ❌ Old: router.patch("/", ...);
router.patch("/:id", userAuth, updatePost); // ✅ Added /:id

// 3. Delete Post (Needs ID)
// ❌ Old: router.delete("/", ...);
router.delete("/:id", userAuth, deletePost); // ✅ Added /:id

// 4. Like Post (Already correct)
router.patch("/:id/like", userAuth, toggleLike);

module.exports = router;