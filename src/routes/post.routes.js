const express = require("express");
const userAuth = require("../middlewares/auth.middleware");
const { createPost, getFeed, updatePost, deletePost, toggleLike } = require("../controllers/post.controller");
const router = express.Router()

router.post(
    "/",
    userAuth,
    createPost
);
router.get(
    "/",
    userAuth,
    getFeed
);
router.patch(
    "/",
    userAuth,
    updatePost
);
router.delete(
    "/",
    userAuth,
    deletePost
);
router.patch(
    "/:id/like",
    userAuth,
    toggleLike
);
module.exports = router;