const Notification = require("../model/notifications");
const asyncHandler = require("../utils/asyncHandler");

// ✅ Get user notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch notifications for the logged-in user, sorted by newest first
    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 });

    res.json(notifications);
});

//  Mark as read
exports.markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
    );

    // If no notification found or doesn't belong to the user, throw 404
    if (!notification) {
        const error = new Error("Notification not found");
        error.statusCode = 404;
        throw error; // Caught by Global Error Handler
    }

    res.json(notification);
});