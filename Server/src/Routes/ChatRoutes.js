import express from "express";
import { 
  getProjectMessages, 
  postMessage, 
  editMessage, 
  deleteMessage, 
  getOnlineUsers 
} from "../controller/ChatController.js";
import authMiddleware from "../Middleware/authenticateMiddelware.js";

const chatRoutes = express.Router();

// Test route to verify chat routes are working
chatRoutes.get("/chat-test", (req, res) => {
  console.log('✅ Chat test route accessed');
  res.status(200).json({ message: "Chat routes are working!" });
});

// Get project messages
chatRoutes.get("/chat/:projectId", authMiddleware, getProjectMessages);

// Post a new message
chatRoutes.post("/chat/:projectId", authMiddleware, postMessage);

// Edit a message
chatRoutes.put("/chat/message/:messageId", authMiddleware, editMessage);

// Delete a message
chatRoutes.delete("/chat/message/:messageId", authMiddleware, deleteMessage);

// Get online users for a project
chatRoutes.get("/chat/:projectId/online-users", authMiddleware, getOnlineUsers);

export default chatRoutes;
