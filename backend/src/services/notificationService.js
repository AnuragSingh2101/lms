import Notification from '../models/Notification.js';

/**
 * Create a new notification for a user
 * @param {string} userId - ID of the target user
 * @param {string} title - Notification title
 * @param {string} message - Notification content
 * @param {string} type - Notification category ('course', 'assignment', 'quiz', 'certificate', 'general')
 */
export const sendNotification = async (userId, title, message, type = 'general') => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type
    });
  } catch (error) {
    console.error(`Error sending notification: ${error.message}`);
  }
};
