const express =require("express");
const router =express.Router();

const userAuth = require("../middlewares/auth.middleware");
const notificationController = require("../controllers/notification.controller");

router.get(
    "/",
    userAuth,
    notificationController.getMyNotifications
);
router.patch(
    "/:id/read",
    userAuth,
    notificationController.markAsRead
);

module.exports = router;