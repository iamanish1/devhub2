import { logger } from '../utils/logger.js';
import user from '../Model/UserModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';

class NotificationService {
  constructor() {
    this.logger = logger;
    this.emailProvider = null;
    this.whatsappProvider = null;
    this.firebaseProvider = null;
    this.initializeProviders();
  }

  /**
   * Initialize notification providers
   */
  async initializeProviders() {
    try {
      // Initialize email provider (you can use nodemailer, SendGrid, etc.)
      // this.emailProvider = new EmailProvider();
      
      // Initialize WhatsApp provider (you can use Twilio, WhatsApp Business API, etc.)
      // this.whatsappProvider = new WhatsAppProvider();
      
      // Initialize Firebase for push notifications
      // this.firebaseProvider = new FirebaseProvider();
      
      this.logger.info('[NotificationService] Providers initialized successfully');
    } catch (error) {
      this.logger.error('[NotificationService] Failed to initialize providers:', error);
    }
  }

  /**
   * Send notification to user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Array} channels - Notification channels ['email', 'whatsapp', 'push']
   */
  async sendNotification(userId, type, data, channels = ['email']) {
    try {
      // Get user details
      const userDetails = await user.findById(userId);
      if (!userDetails) {
        throw new Error(`User not found: ${userId}`);
      }

      const notificationPromises = [];

      // Send email notification
      if (channels.includes('email') && userDetails.email) {
        notificationPromises.push(
          this.sendEmailNotification(userDetails.email, type, data)
        );
      }

      // Send WhatsApp notification
      if (channels.includes('whatsapp') && userDetails.phone) {
        notificationPromises.push(
          this.sendWhatsAppNotification(userDetails.phone, type, data)
        );
      }

      // Send push notification
      if (channels.includes('push')) {
        notificationPromises.push(
          this.sendPushNotification(userId, type, data)
        );
      }

      const results = await Promise.allSettled(notificationPromises);
      
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      this.logger.info(`[NotificationService] Notification sent to user ${userId}. Success: ${successCount}, Failed: ${failureCount}`);

      return {
        success: successCount > 0,
        totalChannels: channels.length,
        successCount,
        failureCount,
        results
      };

    } catch (error) {
      this.logger.error(`[NotificationService] Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(email, type, data) {
    try {
      const emailContent = this.generateEmailContent(type, data);
      
      // Here you would integrate with your email provider
      // Example with nodemailer:
      /*
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      };

      await transporter.sendMail(mailOptions);
      */

      this.logger.info(`[NotificationService] Email sent to ${email} for type: ${type}`);
      return { success: true, channel: 'email', email };

    } catch (error) {
      this.logger.error(`[NotificationService] Email notification failed for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsAppNotification(phone, type, data) {
    try {
      const messageContent = this.generateWhatsAppContent(type, data);
      
      // Here you would integrate with your WhatsApp provider
      // Example with Twilio:
      /*
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: messageContent,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${phone}`
      });
      */

      this.logger.info(`[NotificationService] WhatsApp message sent to ${phone} for type: ${type}`);
      return { success: true, channel: 'whatsapp', phone };

    } catch (error) {
      this.logger.error(`[NotificationService] WhatsApp notification failed for ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId, type, data) {
    try {
      const pushContent = this.generatePushContent(type, data);
      
      // Here you would integrate with Firebase Cloud Messaging
      /*
      const admin = require('firebase-admin');
      const message = {
        notification: {
          title: pushContent.title,
          body: pushContent.body
        },
        data: pushContent.data,
        token: userFCMToken // You'll need to store user's FCM token
      };

      await admin.messaging().send(message);
      */

      this.logger.info(`[NotificationService] Push notification sent to user ${userId} for type: ${type}`);
      return { success: true, channel: 'push', userId };

    } catch (error) {
      this.logger.error(`[NotificationService] Push notification failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate email content based on notification type
   */
  generateEmailContent(type, data) {
    const templates = {
      'user_selected': {
        subject: '🎉 Congratulations! You\'ve been selected for a project',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🎉 Congratulations!</h2>
            <p>Dear ${data.userName},</p>
            <p>Great news! You have been selected to contribute to the project: <strong>${data.projectTitle}</strong></p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60;">Project Details:</h3>
              <p><strong>Project:</strong> ${data.projectTitle}</p>
              <p><strong>Your Bid Amount:</strong> ₹${data.bidAmount}</p>
              <p><strong>Bonus Pool Share:</strong> ₹${data.bonusAmount}</p>
              <p><strong>Total Payment:</strong> ₹${data.totalAmount}</p>
            </div>
            <p>Your bid amount has been locked in escrow and will be released upon project completion.</p>
            <p>Please visit your contribution panel to start working on the project.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.contributionUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Contribution Panel</a>
            </div>
            <p>Best regards,<br>The DevHubs Team</p>
          </div>
        `
      },
      'project_completed': {
        subject: '✅ Project Completed - Payment Released',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #27ae60;">✅ Project Completed!</h2>
            <p>Dear ${data.userName},</p>
            <p>The project <strong>${data.projectTitle}</strong> has been completed successfully!</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60;">Payment Details:</h3>
              <p><strong>Bid Amount:</strong> ₹${data.bidAmount}</p>
              <p><strong>Bonus Pool Share:</strong> ₹${data.bonusAmount}</p>
              <p><strong>Total Payment:</strong> ₹${data.totalAmount}</p>
              <p><strong>Payment Status:</strong> <span style="color: #27ae60;">✅ Released</span></p>
            </div>
            <p>Your payment has been processed and will be credited to your account shortly.</p>
            <p>Thank you for your excellent contribution!</p>
            <p>Best regards,<br>The DevHubs Team</p>
          </div>
        `
      },
      'project_cancelled': {
        subject: '⚠️ Project Cancelled - Refund Processed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">⚠️ Project Cancelled</h2>
            <p>Dear ${data.userName},</p>
            <p>The project <strong>${data.projectTitle}</strong> has been cancelled.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e74c3c;">Refund Details:</h3>
              <p><strong>Bid Amount:</strong> ₹${data.bidAmount}</p>
              <p><strong>Refund Status:</strong> <span style="color: #27ae60;">✅ Processed</span></p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
            <p>Your bid amount has been refunded to your account.</p>
            <p>We apologize for any inconvenience caused.</p>
            <p>Best regards,<br>The DevHubs Team</p>
          </div>
        `
      },
      'selection_started': {
        subject: '🚀 Project Selection Process Started',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3498db;">🚀 Selection Process Started</h2>
            <p>Dear ${data.userName},</p>
            <p>The selection process for project <strong>${data.projectTitle}</strong> has begun.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #3498db;">Project Details:</h3>
              <p><strong>Project:</strong> ${data.projectTitle}</p>
              <p><strong>Required Contributors:</strong> ${data.requiredContributors}</p>
              <p><strong>Total Bids:</strong> ${data.totalBids}</p>
              <p><strong>Selection Mode:</strong> ${data.selectionMode}</p>
            </div>
            <p>You will be notified once the selection process is complete.</p>
            <p>Best regards,<br>The DevHubs Team</p>
          </div>
        `
      },
      'escrow_created': {
        subject: '🔒 Escrow Wallet Created for Project',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9b59b6;">🔒 Escrow Wallet Created</h2>
            <p>Dear ${data.userName},</p>
            <p>An escrow wallet has been created for project <strong>${data.projectTitle}</strong>.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #9b59b6;">Escrow Details:</h3>
              <p><strong>Project:</strong> ${data.projectTitle}</p>
              <p><strong>Bonus Pool Amount:</strong> ₹${data.bonusPoolAmount}</p>
              <p><strong>Total Contributors:</strong> ${data.totalContributors}</p>
              <p><strong>Amount per Contributor:</strong> ₹${data.amountPerContributor}</p>
            </div>
            <p>Funds will be locked in escrow when users are selected and released upon project completion.</p>
            <p>Best regards,<br>The DevHubs Team</p>
          </div>
        `
      }
    };

    return templates[type] || {
      subject: 'DevHubs Notification',
      html: '<p>You have received a notification from DevHubs.</p>'
    };
  }

  /**
   * Generate WhatsApp content based on notification type
   */
  generateWhatsAppContent(type, data) {
    const templates = {
      'user_selected': `🎉 Congratulations! You've been selected for project: ${data.projectTitle}

💰 Payment Details:
• Bid Amount: ₹${data.bidAmount}
• Bonus Pool: ₹${data.bonusAmount}
• Total: ₹${data.totalAmount}

Your funds are locked in escrow and will be released upon completion.

Visit: ${data.contributionUrl}`,

      'project_completed': `✅ Project Completed: ${data.projectTitle}

💰 Payment Released:
• Bid Amount: ₹${data.bidAmount}
• Bonus Pool: ₹${data.bonusAmount}
• Total: ₹${data.totalAmount}

Payment has been processed and credited to your account.`,

      'project_cancelled': `⚠️ Project Cancelled: ${data.projectTitle}

💰 Refund Processed:
• Bid Amount: ₹${data.bidAmount}
• Reason: ${data.reason}

Your bid amount has been refunded to your account.`,

      'selection_started': `🚀 Selection Started: ${data.projectTitle}

📊 Details:
• Contributors Needed: ${data.requiredContributors}
• Total Bids: ${data.totalBids}
• Mode: ${data.selectionMode}

You'll be notified when selection is complete.`,

      'escrow_created': `🔒 Escrow Created: ${data.projectTitle}

💰 Bonus Pool: ₹${data.bonusPoolAmount}
👥 Contributors: ${data.totalContributors}
💵 Per Person: ₹${data.amountPerContributor}

Funds will be locked when users are selected.`
    };

    return templates[type] || 'You have received a notification from DevHubs.';
  }

  /**
   * Generate push notification content
   */
  generatePushContent(type, data) {
    const templates = {
      'user_selected': {
        title: '🎉 Project Selection',
        body: `You've been selected for ${data.projectTitle}`,
        data: {
          type: 'user_selected',
          projectId: data.projectId,
          amount: data.totalAmount.toString()
        }
      },
      'project_completed': {
        title: '✅ Project Completed',
        body: `Payment of ₹${data.totalAmount} released for ${data.projectTitle}`,
        data: {
          type: 'project_completed',
          projectId: data.projectId,
          amount: data.totalAmount.toString()
        }
      },
      'project_cancelled': {
        title: '⚠️ Project Cancelled',
        body: `Refund of ₹${data.bidAmount} processed for ${data.projectTitle}`,
        data: {
          type: 'project_cancelled',
          projectId: data.projectId,
          amount: data.bidAmount.toString()
        }
      },
      'selection_started': {
        title: '🚀 Selection Started',
        body: `Selection process started for ${data.projectTitle}`,
        data: {
          type: 'selection_started',
          projectId: data.projectId
        }
      },
      'escrow_created': {
        title: '🔒 Escrow Created',
        body: `Escrow wallet created for ${data.projectTitle}`,
        data: {
          type: 'escrow_created',
          projectId: data.projectId,
          bonusPool: data.bonusPoolAmount.toString()
        }
      }
    };

    return templates[type] || {
      title: 'DevHubs Notification',
      body: 'You have received a notification',
      data: { type: 'general' }
    };
  }

  /**
   * Send user selection notification
   */
  async sendUserSelectionNotification(userId, projectId, bidAmount, bonusAmount) {
    try {
      const project = await ProjectListing.findById(projectId);
      const userDetails = await user.findById(userId);

      if (!project || !userDetails) {
        throw new Error('Project or user not found');
      }

      const data = {
        userName: userDetails.username,
        projectTitle: project.project_Title,
        projectId: projectId,
        bidAmount: bidAmount,
        bonusAmount: bonusAmount,
        totalAmount: bidAmount + bonusAmount,
        contributionUrl: `${process.env.FRONTEND_URL}/contribution/${projectId}`
      };

      return await this.sendNotification(userId, 'user_selected', data, ['email', 'whatsapp', 'push']);

    } catch (error) {
      this.logger.error(`[NotificationService] Error sending user selection notification:`, error);
      throw error;
    }
  }

  /**
   * Send project completion notification
   */
  async sendProjectCompletionNotification(userId, projectId, bidAmount, bonusAmount) {
    try {
      const project = await ProjectListing.findById(projectId);
      const userDetails = await user.findById(userId);

      if (!project || !userDetails) {
        throw new Error('Project or user not found');
      }

      const data = {
        userName: userDetails.username,
        projectTitle: project.project_Title,
        projectId: projectId,
        bidAmount: bidAmount,
        bonusAmount: bonusAmount,
        totalAmount: bidAmount + bonusAmount
      };

      return await this.sendNotification(userId, 'project_completed', data, ['email', 'whatsapp', 'push']);

    } catch (error) {
      this.logger.error(`[NotificationService] Error sending project completion notification:`, error);
      throw error;
    }
  }

  /**
   * Send project cancellation notification
   */
  async sendProjectCancellationNotification(userId, projectId, bidAmount, reason) {
    try {
      const project = await ProjectListing.findById(projectId);
      const userDetails = await user.findById(userId);

      if (!project || !userDetails) {
        throw new Error('Project or user not found');
      }

      const data = {
        userName: userDetails.username,
        projectTitle: project.project_Title,
        projectId: projectId,
        bidAmount: bidAmount,
        reason: reason
      };

      return await this.sendNotification(userId, 'project_cancelled', data, ['email', 'whatsapp', 'push']);

    } catch (error) {
      this.logger.error(`[NotificationService] Error sending project cancellation notification:`, error);
      throw error;
    }
  }

  /**
   * Send selection started notification to project owner
   */
  async sendSelectionStartedNotification(projectOwnerId, projectId, selectionConfig) {
    try {
      const project = await ProjectListing.findById(projectId);
      const userDetails = await user.findById(projectOwnerId);

      if (!project || !userDetails) {
        throw new Error('Project or user not found');
      }

      const data = {
        userName: userDetails.username,
        projectTitle: project.project_Title,
        projectId: projectId,
        requiredContributors: selectionConfig.requiredContributors,
        totalBids: selectionConfig.totalBids || 0,
        selectionMode: selectionConfig.selectionMode
      };

      return await this.sendNotification(projectOwnerId, 'selection_started', data, ['email', 'push']);

    } catch (error) {
      this.logger.error(`[NotificationService] Error sending selection started notification:`, error);
      throw error;
    }
  }

  /**
   * Send escrow created notification to project owner
   */
  async sendEscrowCreatedNotification(projectOwnerId, projectId, bonusPoolAmount, totalContributors) {
    try {
      const project = await ProjectListing.findById(projectId);
      const userDetails = await user.findById(projectOwnerId);

      if (!project || !userDetails) {
        throw new Error('Project or user not found');
      }

      const data = {
        userName: userDetails.username,
        projectTitle: project.project_Title,
        projectId: projectId,
        bonusPoolAmount: bonusPoolAmount,
        totalContributors: totalContributors,
        amountPerContributor: Math.floor(bonusPoolAmount / totalContributors)
      };

      return await this.sendNotification(projectOwnerId, 'escrow_created', data, ['email', 'push']);

    } catch (error) {
      this.logger.error(`[NotificationService] Error sending escrow created notification:`, error);
      throw error;
    }
  }
}

export default new NotificationService();
