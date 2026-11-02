const Notification = require('../models/Notification');
const fail = (status, message) => Object.assign(new Error(message), { status });

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({
    notifications,
    unreadCount: notifications.filter(notification => !notification.isRead).length,
  });
};

exports.markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { isRead: true } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!notification) throw fail(404, 'Không tìm thấy thông báo');
  res.json({ notification });
};
