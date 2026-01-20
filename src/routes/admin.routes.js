const express = require("express");
const router = express.Router();

const userAuth = require("../middlewares/auth.middleware");
const roleAuth = require("../middlewares/role.middleware");

const adminController = require("../controllers/admin.controller");


//all admin routes protected

router.use(userAuth);
router.use(roleAuth(["admin"]));

router.get(
    "/users",
    adminController.getAllUsers
);

router.patch(
    "/users/:id/block",
    adminController.toggleBlockUser
);

router.get(
    "/posts",
    adminController.getAllPosts
);

router.delete(
    "/posts/:id",
    adminController.deletePost
);

router.get(
    "/stats",
    adminController.getStats
);
module.exports = router