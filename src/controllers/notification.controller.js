const Notification =require("../model/notifications");

//get user notifications

exports.getMyNotifications = async (req,res)=>{
    try {
        console.log(Notification.schema.paths);


        const userId = req.user._id;
        const notifications = await Notification.find({userId})
        .sort({createdAt:-1})
        res.json(notifications);
    }catch(err){
        console.error("Fetch notifications failed:",err);
        res.status(500).json({message:"Server error"})
        

    }
};
  //mark as read

  exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("Mark notification read failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};
