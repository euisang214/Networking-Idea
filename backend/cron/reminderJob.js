const cron = require('node-cron');
const Session = require('../models/session');
const NotificationService = require('../services/notificationService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Session reminder job
 * Sends reminders for upcoming sessions
 * Runs every hour
 */
const reminderJob = cron.schedule('0 * * * *', async () => {
  logger.info('Running session reminder job');
  
  try {
    const now = new Date();
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Find sessions starting in the next 24 hours and 1 hour
    const upcomingSessions = await Session.find({
      startTime: { $gt: now, $lt: oneDayAhead },
      status: 'scheduled'
    }).populate('user').populate({
      path: 'professional',
      populate: { path: 'user' }
    });
    
    for (const session of upcomingSessions) {
      const sessionStartTime = new Date(session.startTime);
      const hoursUntilSession = Math.round((sessionStartTime - now) / (1000 * 60 * 60));
      
      // Send 24-hour reminder
      if (hoursUntilSession <= 24 && hoursUntilSession > 23) {
        await sendReminder(session, '24-hour');
      }
      
      // Send 1-hour reminder
      if (hoursUntilSession <= 1) {
        await sendReminder(session, '1-hour');
      }
    }
    
    logger.info(`Processed ${upcomingSessions.length} upcoming sessions for reminders`);
  } catch (error) {
    logger.error(`Error in session reminder job: ${error.message}`, { error });
  }
});

/**
 * Send session reminder notification and email
 * @param {Object} session - Session document
 * @param {string} reminderType - Type of reminder ('24-hour' or '1-hour')
 */
async function sendReminder(session, reminderType) {
  try {
    const formattedStartTime = new Date(session.startTime).toLocaleString();
    const reminderText = reminderType === '24-hour' 
      ? `Your session is scheduled for tomorrow at ${formattedStartTime}`
      : `Your session is starting in 1 hour at ${formattedStartTime}`;
    
    // Send notification to user
    await NotificationService.sendNotification(session.user._id, 'sessionReminder', {
      sessionId: session._id,
      message: reminderText,
      reminderType
    });
    
    // Send notification to professional
    await NotificationService.sendNotification(session.professional.user._id, 'sessionReminder', {
      sessionId: session._id,
      message: reminderText,
      reminderType
    });
    
    // Send email to user if they have email notifications enabled
    if (session.user.settings?.notifications?.email?.sessionReminders) {
      await EmailService.sendEmail(
        session.user.email,
        `Upcoming Session Reminder: ${reminderType === '24-hour' ? '24 hours' : '1 hour'} remaining`,
        'session-reminder',
        {
          userName: `${session.user.firstName} ${session.user.lastName}`,
          professionalName: `${session.professional.user.firstName} ${session.professional.user.lastName}`,
          sessionDate: formattedStartTime,
          sessionDuration: (session.endTime - session.startTime) / (1000 * 60), // minutes
          zoomLink: session.zoomMeetingUrl,
          zoomPassword: session.zoomMeetingPassword,
          sessionId: session._id,
          reminderType
        }
      );
    }
    
    // Send email to professional if they have email notifications enabled
    if (session.professional.user.settings?.notifications?.email?.sessionReminders) {
      await EmailService.sendEmail(
        session.professional.user.email,
        `Upcoming Session Reminder: ${reminderType === '24-hour' ? '24 hours' : '1 hour'} remaining`,
        'session-reminder-professional',
        {
          professionalName: `${session.professional.user.firstName} ${session.professional.user.lastName}`,
          candidateName: `${session.user.firstName} ${session.user.lastName}`,
          sessionDate: formattedStartTime,
          sessionDuration: (session.endTime - session.startTime) / (1000 * 60), // minutes
          zoomLink: session.zoomMeetingUrl,
          zoomStartUrl: session.zoomStartUrl,
          sessionId: session._id,
          reminderType
        }
      );
    }
    
    logger.info(`Sent ${reminderType} reminder for session ${session._id}`);
  } catch (error) {
    logger.error(`Error sending reminder for session ${session._id}: ${error.message}`);
  }
}

module.exports = reminderJob;