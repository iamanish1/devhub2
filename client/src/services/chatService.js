import io from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentProjectId = null;
    this.messageHandlers = new Map();
    this.typingHandlers = new Map();
    this.userHandlers = new Map();
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket = io(API_BASE_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      // Set up message handlers
      this.setupMessageHandlers();
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentProjectId = null;
    }
  }

  // Join project chat room
  joinProject(projectId, userId, username) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.currentProjectId = projectId;
    this.socket.emit('joinRoom', { projectId, userId, username });
  }

  // Leave current project room
  leaveProject() {
    if (this.socket && this.currentProjectId) {
      this.socket.emit('leaveRoom', { projectId: this.currentProjectId });
      this.currentProjectId = null;
    }
  }

  // Send message
  sendMessage(text, messageType = 'text', fileData = null) {
    if (!this.socket || !this.isConnected || !this.currentProjectId) {
      throw new Error('Socket not connected or no project joined');
    }

    const messageData = {
      projectId: this.currentProjectId,
      text,
      messageType
    };

    if (fileData) {
      Object.assign(messageData, fileData);
    }

    this.socket.emit('sendMessage', messageData);
  }

  // Edit message
  editMessage(messageId, newText) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('editMessage', { messageId, newText });
  }

  // Delete message
  deleteMessage(messageId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('deleteMessage', { messageId });
  }

  // Send typing indicator
  sendTypingIndicator(isTyping) {
    if (!this.socket || !this.isConnected || !this.currentProjectId) {
      return;
    }

    this.socket.emit('typing', { projectId: this.currentProjectId, isTyping });
  }

  // Send user activity
  sendUserActivity() {
    if (!this.socket || !this.isConnected || !this.currentProjectId) {
      return;
    }

    this.socket.emit('userActivity', { projectId: this.currentProjectId });
  }

  // Set up message handlers
  setupMessageHandlers() {
    if (!this.socket) return;

    // Handle incoming messages
    this.socket.on('receiveMessage', (message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    // Handle message edits
    this.socket.on('messageEdited', (message) => {
      this.messageHandlers.forEach(handler => handler(message, 'edited'));
    });

    // Handle message deletions
    this.socket.on('messageDeleted', (data) => {
      this.messageHandlers.forEach(handler => handler(data, 'deleted'));
    });

    // Handle typing indicators
    this.socket.on('userTyping', (data) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    // Handle user join/leave events
    this.socket.on('userJoined', (data) => {
      this.userHandlers.forEach(handler => handler(data, 'joined'));
    });

    this.socket.on('userLeft', (data) => {
      this.userHandlers.forEach(handler => handler(data, 'left'));
    });

    this.socket.on('onlineUsers', (users) => {
      this.userHandlers.forEach(handler => handler(users, 'online'));
    });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Add message handler
  onMessage(handler) {
    const id = Date.now() + Math.random();
    this.messageHandlers.set(id, handler);
    return () => this.messageHandlers.delete(id);
  }

  // Add typing handler
  onTyping(handler) {
    const id = Date.now() + Math.random();
    this.typingHandlers.set(id, handler);
    return () => this.typingHandlers.delete(id);
  }

  // Add user handler
  onUserEvent(handler) {
    const id = Date.now() + Math.random();
    this.userHandlers.set(id, handler);
    return () => this.userHandlers.delete(id);
  }

  // API Methods
  async getProjectMessages(projectId, page = 1, limit = 50) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/chat/${projectId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getOnlineUsers(projectId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/chat/${projectId}/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }

  async uploadFile(file, projectId) {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const response = await axios.post(`${API_BASE_URL}/api/upload/chat-file`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService;
