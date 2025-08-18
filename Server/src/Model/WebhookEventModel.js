import mongoose from "mongoose";

const WebhookEventSchema = new mongoose.Schema({
  provider: String,
  eventType: String,
  eventId: { 
    type: String, 
    unique: true 
  },
  signature: String,
  processed: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

const WebhookEvent = mongoose.model('WebhookEvent', WebhookEventSchema);
export default WebhookEvent;
