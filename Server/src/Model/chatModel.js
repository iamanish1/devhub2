import ProjectListing from "./ProjectListingModel.js";
import user from "./UserModel.js";
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Projectlisting",
    required: true,
  },
  senderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['admin', 'contributor', 'owner'],
    default: 'contributor'
  },
  text: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "chat",
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
chatSchema.index({ projectId: 1, timestamp: -1 });
chatSchema.index({ senderID: 1 });

const Chat = mongoose.model("chat", chatSchema);

export default Chat;