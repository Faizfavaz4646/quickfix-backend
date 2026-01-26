const express = require("express");
const userAuth = require("../middlewares/auth.middleware");
const { addComment, getComments, deleteComment } = require("../controllers/comment.controller");

const router = express.Router();

// POST /api/comments/:postId -> Add a comment
router.post("/:postId", userAuth, addComment);

// GET /api/comments/:postId -> Get all comments for a post
router.get("/:postId", userAuth, getComments);

// DELETE /api/comments/:commentId -> Delete a comment
router.delete("/:commentId", userAuth, deleteComment);

module.exports = router;