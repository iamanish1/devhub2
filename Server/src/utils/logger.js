export const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  },
  
  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  },
  
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
};

export const logPaymentEvent = (event, data) => {
  logger.info(`Payment Event: ${event}`, {
    timestamp: new Date().toISOString(),
    event,
    ...data
  });
};

export const logWebhookEvent = (provider, eventType, eventId, data = {}) => {
  logger.info(`Webhook Event: ${provider} - ${eventType}`, {
    eventId,
    provider,
    eventType,
    ...data
  });
};
