import Chat from "../Model/chatModel.js";
import user from "../Model/UserModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";

// Store online users for each project
const onlineUsers = new Map(); // projectId -> Set of socketIds
const userSockets = new Map(); // socketId -> { userId, projectId, username }

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("New user connected: " + socket.id);

    // Join project room and track user
    socket.on("joinRoom", async ({ projectId, userId, username }) => {
      try {
        // Validate user and project
        const userDetails = await user.findById(userId);
        const project = await ProjectListing.findById(projectId);
        
        if (!userDetails || !project) {
          socket.emit("error", { message: "Invalid user or project" });
          return;
        }

        // Join the room
        socket.join(projectId);
        
        // Store user socket info
        userSockets.set(socket.id, { userId, projectId, username });
        
        // Add to online users for this project
        if (!onlineUsers.has(projectId)) {
          onlineUsers.set(projectId, new Set());
        }
        onlineUsers.get(projectId).add(socket.id);
        
        // Determine user role
        let userRole = 'contributor';
        if (project.ownerId.toString() === userId.toString()) {
          userRole = 'owner';
        } else if (userDetails.role === 'admin') {
          userRole = 'admin';
        }
        
        // Emit user joined event
        io.to(projectId).emit("userJoined", {
          userId,
          username,
          userRole,
          timestamp: new Date()
        });
        
        // Send current online users to the new user
        const projectOnlineUsers = Array.from(onlineUsers.get(projectId)).map(socketId => {
          const userInfo = userSockets.get(socketId);
          return userInfo ? { userId: userInfo.userId, username: userInfo.username } : null;
        }).filter(Boolean);
        
        socket.emit("onlineUsers", projectOnlineUsers);
        
        console.log(`User ${username} (${userId}) joined room: ${projectId}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ projectId, text, messageType = 'text', fileUrl, fileName, fileSize, replyTo }) => {
      try {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo || userInfo.projectId !== projectId) {
          socket.emit("error", { message: "Not authorized to send messages in this room" });
          return;
        }

        const { userId, username } = userInfo;
        
        // Get user details for role determination
        const userDetails = await user.findById(userId);
        const project = await ProjectListing.findById(projectId);
        
        if (!userDetails || !project) {
          socket.emit("error", { message: "User or project not found" });
          return;
        }
        
        // Determine user role
        let senderRole = 'contributor';
        if (project.ownerId.toString() === userId.toString()) {
          senderRole = 'owner';
        } else if (userDetails.role === 'admin') {
          senderRole = 'admin';
        }
        
        // Create and save message
        const chat = new Chat({
          projectId,
          senderID: userId,
          senderName: username,
          senderRole,
          text,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          replyTo,
          timestamp: new Date(),
        });
        
        await chat.save();
        await chat.populate('senderID', 'username email profilePicture');
        
        // Emit message to all users in the room
        io.to(projectId).emit("receiveMessage", chat);
        
        console.log(`Message sent by ${username} in project ${projectId}: ${text.substring(0, 50)}...`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", ({ projectId, isTyping }) => {
      const userInfo = userSockets.get(socket.id);
      if (userInfo && userInfo.projectId === projectId) {
        socket.to(projectId).emit("userTyping", {
          userId: userInfo.userId,
          username: userInfo.username,
          isTyping
        });
      }
    });

    // Handle message editing
    socket.on("editMessage", async ({ messageId, newText }) => {
      try {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        const message = await Chat.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Check if user can edit this message
        if (message.senderID.toString() !== userInfo.userId) {
          socket.emit("error", { message: "You can only edit your own messages" });
          return;
        }

        message.text = newText;
        message.isEdited = true;
        message.editedAt = new Date();
        
        await message.save();
        await message.populate('senderID', 'username email profilePicture');
        
        // Emit edited message to all users in the room
        io.to(message.projectId.toString()).emit("messageEdited", message);
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // Handle message deletion
    socket.on("deleteMessage", async ({ messageId }) => {
      try {
        const userInfo = userSockets.get(socket.id);
        if (!userInfo) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        const message = await Chat.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Check if user can delete this message
        const userDetails = await user.findById(userInfo.userId);
        if (message.senderID.toString() !== userInfo.userId && userDetails.role !== 'admin') {
          socket.emit("error", { message: "You can only delete your own messages" });
          return;
        }

        await Chat.findByIdAndDelete(messageId);
        
        // Emit message deletion to all users in the room
        io.to(message.projectId.toString()).emit("messageDeleted", { messageId });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Handle user activity (for online status)
    socket.on("userActivity", ({ projectId }) => {
      const userInfo = userSockets.get(socket.id);
      if (userInfo && userInfo.projectId === projectId) {
        // Update last activity timestamp
        userInfo.lastActivity = new Date();
        userSockets.set(socket.id, userInfo);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userInfo = userSockets.get(socket.id);
      if (userInfo) {
        const { projectId, userId, username } = userInfo;
        
        // Remove from online users
        if (onlineUsers.has(projectId)) {
          onlineUsers.get(projectId).delete(socket.id);
          
          // If no more users in this project, remove the project entry
          if (onlineUsers.get(projectId).size === 0) {
            onlineUsers.delete(projectId);
          }
        }
        
        // Remove user socket info
        userSockets.delete(socket.id);
        
        // Emit user left event
        io.to(projectId).emit("userLeft", {
          userId,
          username,
          timestamp: new Date()
        });
        
        console.log(`User ${username} (${userId}) disconnected from room: ${projectId}`);
      }
      
      console.log("User disconnected: " + socket.id);
    });
  });
};

export default chatSocket;
