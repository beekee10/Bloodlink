import mongoose from 'mongoose';
import { Notification } from '../models/mongooseModels.js';

/**
 * Create a new notification for a user.
 */
async function createNotification(userId, title, message) {
  const notifObj = await Notification.create({
    userId: new mongoose.Types.ObjectId(userId),
    title,
    message,
    isRead: false
  });
  const res = notifObj.toObject();
  res.id = res._id.toString();
  res.userId = res.userId.toString();
  return res;
}

/**
 * Find all notifications for a specific user.
 */
async function findManyByUserId(userId) {
  const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
  return notifications.map(n => ({
    ...n,
    id: n._id.toString(),
    userId: n.userId.toString()
  }));
}

/**
 * Mark a specific notification as read.
 */
async function markAsRead(id) {
  const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean();
  if (notif) {
    notif.id = notif._id.toString();
    notif.userId = notif.userId.toString();
  }
  return notif;
}

export {
  createNotification,
  findManyByUserId,
  markAsRead
};
