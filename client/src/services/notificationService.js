import { toast } from 'react-hot-toast';

/**
 * Frontend Notification Service
 * Handles user notifications and alerts
 */
export const notificationService = {
  /**
   * Show success notification
   */
  success: (message, options = {}) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  /**
   * Show error notification
   */
  error: (message, options = {}) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options
    });
  },

  /**
   * Show warning notification
   */
  warning: (message, options = {}) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b'
      },
      ...options
    });
  },

  /**
   * Show info notification
   */
  info: (message, options = {}) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #3b82f6'
      },
      ...options
    });
  },

  /**
   * Show loading notification
   */
  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      ...options
    });
  },

  /**
   * Dismiss notification
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Show project selection notification
   */
  projectSelection: (projectTitle, isSelected = true) => {
    if (isSelected) {
      notificationService.success(
        `🎉 Congratulations! You've been selected for "${projectTitle}"`,
        {
          duration: 6000,
          icon: '🎉'
        }
      );
    } else {
      notificationService.info(
        `Selection process completed for "${projectTitle}". Check your dashboard for updates.`,
        {
          duration: 5000
        }
      );
    }
  },

  /**
   * Show escrow notification
   */
  escrowUpdate: (action, amount, projectTitle) => {
    const messages = {
      created: `🔒 Escrow wallet created for "${projectTitle}"`,
      locked: `💰 ₹${amount} locked in escrow for "${projectTitle}"`,
      released: `✅ ₹${amount} released from escrow for "${projectTitle}"`,
      refunded: `↩️ ₹${amount} refunded from escrow for "${projectTitle}"`,
      completed: `🎊 Project "${projectTitle}" completed! Funds have been released.`
    };

    const message = messages[action] || `Escrow update for "${projectTitle}"`;
    
    if (action === 'completed') {
      notificationService.success(message, { duration: 8000 });
    } else if (action === 'created') {
      notificationService.success(message, { duration: 6000 });
    } else if (action === 'refunded') {
      notificationService.warning(message, { duration: 6000 });
    } else {
      notificationService.info(message, { duration: 5000 });
    }
  },

  /**
   * Show task notification
   */
  taskUpdate: (action, taskTitle, projectTitle) => {
    const messages = {
      created: `📝 New task "${taskTitle}" created in "${projectTitle}"`,
      assigned: `👤 Task "${taskTitle}" assigned to you in "${projectTitle}"`,
      completed: `✅ Task "${taskTitle}" completed in "${projectTitle}"`,
      updated: `📝 Task "${taskTitle}" updated in "${projectTitle}"`
    };

    const message = messages[action] || `Task update in "${projectTitle}"`;
    
    if (action === 'completed') {
      notificationService.success(message);
    } else if (action === 'assigned') {
      notificationService.info(message);
    } else {
      notificationService.info(message);
    }
  },

  /**
   * Show payment notification
   */
  paymentUpdate: (action, amount, projectTitle) => {
    const messages = {
      received: `💰 Payment of ₹${amount} received for "${projectTitle}"`,
      processed: `✅ Payment of ₹${amount} processed for "${projectTitle}"`,
      failed: `❌ Payment of ₹${amount} failed for "${projectTitle}"`,
      pending: `⏳ Payment of ₹${amount} pending for "${projectTitle}"`
    };

    const message = messages[action] || `Payment update for "${projectTitle}"`;
    
    if (action === 'received' || action === 'processed') {
      notificationService.success(message);
    } else if (action === 'failed') {
      notificationService.error(message);
    } else {
      notificationService.warning(message);
    }
  },

  /**
   * Show general project notification
   */
  projectUpdate: (action, projectTitle, details = '') => {
    const messages = {
      created: `🚀 New project "${projectTitle}" created`,
      updated: `📝 Project "${projectTitle}" updated`,
      completed: `🎊 Project "${projectTitle}" completed!`,
      cancelled: `❌ Project "${projectTitle}" cancelled`,
      milestone: `🎯 Milestone reached in "${projectTitle}"`,
      deadline: `⏰ Deadline approaching for "${projectTitle}"`
    };

    const message = details || messages[action] || `Project update for "${projectTitle}"`;
    
    if (action === 'completed') {
      notificationService.success(message, { duration: 8000 });
    } else if (action === 'cancelled') {
      notificationService.error(message);
    } else if (action === 'deadline') {
      notificationService.warning(message);
    } else {
      notificationService.info(message);
    }
  },

  /**
   * Show team notification
   */
  teamUpdate: (action, memberName, projectTitle) => {
    const messages = {
      joined: `👋 ${memberName} joined "${projectTitle}"`,
      left: `👋 ${memberName} left "${projectTitle}"`,
      role_changed: `👤 ${memberName}'s role changed in "${projectTitle}"`,
      message: `💬 New message from ${memberName} in "${projectTitle}"`
    };

    const message = messages[action] || `Team update in "${projectTitle}"`;
    notificationService.info(message);
  },

  /**
   * Show system notification
   */
  system: (action, details = '') => {
    const messages = {
      maintenance: '🔧 System maintenance scheduled',
      update: '🔄 System update available',
      error: '⚠️ System error occurred',
      welcome: '🎉 Welcome to DevHubs!',
      profile_updated: '✅ Profile updated successfully',
      settings_saved: '✅ Settings saved successfully'
    };

    const message = details || messages[action] || 'System notification';
    
    if (action === 'error') {
      notificationService.error(message);
    } else if (action === 'maintenance') {
      notificationService.warning(message);
    } else {
      notificationService.success(message);
    }
  }
};

export default notificationService;
