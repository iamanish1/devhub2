import Chat from "../Model/chatModel.js";
import user from "../Model/UserModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";

// Store online users for each project
const onlineUsers = new Map(); // projectId -> Set of socketIds
const userSockets = new Map(); // socketId -> { userId, projectId, username }

const chatSocket = (io) => {
  console.log('🔧 Socket.IO: Chat socket initialized');
  
  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Socket.IO: Testing database connection...');
      const testUser = await user.findOne().limit(1);
      const testProject = await ProjectListing.findOne().limit(1);
      console.log('✅ Socket.IO: Database connection successful');
      console.log('🔍 Socket.IO: Test user found:', testUser ? 'Yes' : 'No');
      console.log('🔍 Socket.IO: Test project found:', testProject ? 'Yes' : 'No');
      return true;
    } catch (error) {
      console.error('❌ Socket.IO: Database connection failed:', error);
      return false;
    }
  };
  
  // Test connection on initialization
  testDatabaseConnection();
  
  // Periodic broadcast of online users to all rooms
  setInterval(() => {
    onlineUsers.forEach((socketIds, projectId) => {
      const projectOnlineUsers = Array.from(socketIds).map(socketId => {
        const userInfo = userSockets.get(socketId);
        return userInfo ? { userId: userInfo.userId, username: userInfo.username } : null;
      }).filter(Boolean);
      
      if (projectOnlineUsers.length > 0) {
        io.to(projectId).emit("onlineUsers", projectOnlineUsers);
      }
    });
  }, 30000); // Broadcast every 30 seconds
  
  io.on("connection", (socket) => {
    console.log("✅ Socket.IO: New user connected:", socket.id);

    // Test database connection
    socket.on("testConnection", async () => {
      try {
        console.log('🔍 Socket: Testing database connection...');
        const testUser = await user.findOne().limit(1);
        const testProject = await ProjectListing.findOne().limit(1);
        console.log('✅ Socket: Database connection successful');
        console.log('🔍 Socket: Test user found:', testUser ? 'Yes' : 'No');
        console.log('🔍 Socket: Test project found:', testProject ? 'Yes' : 'No');
        socket.emit("connectionTest", { success: true, message: "Database connection working" });
      } catch (error) {
        console.error('❌ Socket: Database connection failed:', error);
        socket.emit("connectionTest", { success: false, message: error.message });
      }
    });

    // Join project room and track user
    socket.on("joinRoom", async ({ projectId, userId, username }) => {
      try {
        console.log('🔍 Socket: joinRoom called with:', { projectId, userId, username });
        
        // Validate input parameters
        if (!projectId || !userId || !username) {
          console.error('❌ Socket: Missing required parameters:', { projectId, userId, username });
          socket.emit("error", { message: "Missing required parameters" });
          return;
        }

        // Validate user and project
        console.log('🔍 Socket: Validating user and project...');
        console.log('🔍 Socket: User ID type:', typeof userId, 'Value:', userId);
        console.log('🔍 Socket: Project ID type:', typeof projectId, 'Value:', projectId);
        
        try {
          console.log('🔍 Socket: Attempting to find user with ID:', userId);
          const userDetails = await user.findById(userId);
          console.log('🔍 Socket: User query result:', userDetails ? 'Found' : 'Not found');
          if (userDetails) {
            console.log('🔍 Socket: User details:', {
              _id: userDetails._id,
              username: userDetails.username,
              email: userDetails.email,
              usertype: userDetails.usertype
            });
          }
        } catch (userError) {
          console.error('❌ Socket: Error finding user:', userError);
        }
        
        try {
          console.log('🔍 Socket: Attempting to find project with ID:', projectId);
          const project = await ProjectListing.findById(projectId);
          console.log('🔍 Socket: Project query result:', project ? 'Found' : 'Not found');
          if (project) {
            console.log('🔍 Socket: Project details:', {
              _id: project._id,
              title: project.project_Title,
              user: project.user
            });
          }
        } catch (projectError) {
          console.error('❌ Socket: Error finding project:', projectError);
        }
        
        const userDetails = await user.findById(userId);
        const project = await ProjectListing.findById(projectId);
        
        console.log('🔍 Socket: User details:', userDetails ? 'Found' : 'Not found');
        console.log('🔍 Socket: Project details:', project ? 'Found' : 'Not found');
        
        if (!userDetails) {
          console.error('❌ Socket: User not found:', userId);
          socket.emit("error", { message: "User not found" });
          return;
        }
        
        if (!project) {
          console.error('❌ Socket: Project not found:', projectId);
          socket.emit("error", { message: "Project not found" });
          return;
        }

        // Join the room
        console.log('🔍 Socket: Joining room:', projectId);
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
        if (project.user.toString() === userId.toString()) {
          userRole = 'owner';
        } else if (userDetails.usertype === 'Senior Developer') {
          userRole = 'admin';
        }
        
        console.log('🔍 Socket: User role determined:', userRole);
        
        // Emit user joined event
        io.to(projectId).emit("userJoined", {
          userId,
          username,
          userRole,
          timestamp: new Date()
        });
        
        // Send current online users to all users in the room
        const projectOnlineUsers = Array.from(onlineUsers.get(projectId)).map(socketId => {
          const userInfo = userSockets.get(socketId);
          return userInfo ? { userId: userInfo.userId, username: userInfo.username } : null;
        }).filter(Boolean);
        
        // Broadcast updated online users list to all users in the room
        io.to(projectId).emit("onlineUsers", projectOnlineUsers);
        
        console.log(`✅ Socket: User ${username} (${userId}) successfully joined room: ${projectId}`);
      } catch (error) {
        console.error("❌ Socket: Error joining room:", error);
        console.error("❌ Socket: Error details:", {
          message: error.message,
          stack: error.stack,
          projectId,
          userId,
          username
        });
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
        if (project.user.toString() === userId.toString()) {
          senderRole = 'owner';
        } else if (userDetails.usertype === 'Senior Developer') {
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
        if (message.senderID.toString() !== userInfo.userId && userDetails.usertype !== 'Senior Developer') {
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
        
        // Broadcast updated online users list to remaining users
        const remainingOnlineUsers = Array.from(onlineUsers.get(projectId) || []).map(socketId => {
          const userInfo = userSockets.get(socketId);
          return userInfo ? { userId: userInfo.userId, username: userInfo.username } : null;
        }).filter(Boolean);
        
        io.to(projectId).emit("onlineUsers", remainingOnlineUsers);
        
        console.log(`User ${username} (${userId}) disconnected from room: ${projectId}`);
      }
      
      console.log("User disconnected: " + socket.id);
    });
  });
};

export default chatSocket;
