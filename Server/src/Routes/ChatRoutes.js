import express from "express";
import { 
  getProjectMessages, 
  postMessage, 
  editMessage, 
  deleteMessage, 
  getOnlineUsers 
} from "../controller/ChatController.js";
import { authenticateMiddelware } from "../Middleware/authenticateMiddelware.js";

const chatRoutes = express.Router();

// Get project messages
chatRoutes.get("/chat/:projectId", authenticateMiddelware, getProjectMessages);

// Post a new message
chatRoutes.post("/chat/:projectId", authenticateMiddelware, postMessage);

// Edit a message
chatRoutes.put("/chat/message/:messageId", authenticateMiddelware, editMessage);

// Delete a message
chatRoutes.delete("/chat/message/:messageId", authenticateMiddelware, deleteMessage);

// Get online users for a project
chatRoutes.get("/chat/:projectId/online-users", authenticateMiddelware, getOnlineUsers);

export default chatRoutes;
