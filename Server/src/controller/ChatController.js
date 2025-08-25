import Chat from "../Model/chatModel.js";
import user from "../Model/UserModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";

// Get all messages for a specific project chat room with user details
export const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const messages = await Chat.find({ projectId })
      .populate('senderID', 'username email profilePicture')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalMessages = await Chat.countDocuments({ projectId });
    
    res.status(200).json({
      messages: messages.reverse(), // Return in chronological order
      totalMessages,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: skip + messages.length < totalMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Post a new message
export const postMessage = async (req, res) => {
  try {
    const { projectId, text, messageType = 'text', fileUrl, fileName, fileSize, replyTo } = req.body;
    const senderId = req.user._id;
    
    // Get user details
    const userDetails = await user.findById(senderId);
    if (!userDetails) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if project exists and user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Determine user role
    let senderRole = 'contributor';
    if (project.ownerId.toString() === senderId.toString()) {
      senderRole = 'owner';
    } else if (req.user.role === 'admin') {
      senderRole = 'admin';
    }
    
    const message = new Chat({
      projectId,
      senderID: senderId,
      senderName: userDetails.username || userDetails.name,
      senderRole,
      text,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      replyTo,
      timestamp: new Date(),
    });
    
    await message.save();
    
    // Populate sender details for response
    await message.populate('senderID', 'username email profilePicture');
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;
    
    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Check if user can edit this message
    if (message.senderID.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }
    
    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    
    await message.save();
    await message.populate('senderID', 'username email profilePicture');
    
    res.status(200).json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: "Failed to edit message" });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const senderId = req.user._id;
    
    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Check if user can delete this message (sender or admin)
    if (message.senderID.toString() !== senderId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }
    
    await Chat.findByIdAndDelete(messageId);
    
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// Get online users for a project
export const getOnlineUsers = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // This would typically integrate with your socket.io online users tracking
    // For now, return a basic response
    res.status(200).json({
      onlineUsers: [],
      totalMembers: 0
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: "Failed to fetch online users" });
  }
};