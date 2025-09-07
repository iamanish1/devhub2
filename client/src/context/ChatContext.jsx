import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // projectId -> users array
  const [isConnected, setIsConnected] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // Initialize chat service connection
  useEffect(() => {
    if (!user) return;

    const initializeChat = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await chatService.connect(token);
        setIsConnected(true);

        // Set up global online users handler
        const unsubscribeOnlineUsers = chatService.onUserEvent((data, eventType) => {
          if (eventType === 'online' && currentProjectId) {
            setOnlineUsers(prev => {
              const newMap = new Map(prev);
              newMap.set(currentProjectId, data);
              return newMap;
            });
          }
        });

        return () => {
          unsubscribeOnlineUsers();
        };
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsConnected(false);
      }
    };

    initializeChat();

    return () => {
      chatService.disconnect();
      setIsConnected(false);
    };
  }, [user, currentProjectId]);

  // Join project room
  const joinProject = useCallback(async (projectId) => {
    if (!user || !isConnected || projectId === currentProjectId) return;

    try {
      // Leave current project if any
      if (currentProjectId) {
        chatService.leaveProject();
      }

      // Join new project
      chatService.joinProject(projectId, user._id, user.username || user.name);
      setCurrentProjectId(projectId);

      // Load cached online users for immediate display
      const cachedOnlineUsers = chatService.getCachedOnlineUsers(projectId);
      if (cachedOnlineUsers.length > 0) {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(projectId, cachedOnlineUsers);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to join project:', error);
    }
  }, [user, isConnected, currentProjectId]);

  // Leave current project
  const leaveProject = useCallback(() => {
    if (currentProjectId) {
      chatService.leaveProject();
      setCurrentProjectId(null);
    }
  }, [currentProjectId]);

  // Get online users for a specific project
  const getOnlineUsers = useCallback((projectId) => {
    return onlineUsers.get(projectId) || [];
  }, [onlineUsers]);

  // Get online users count for a specific project
  const getOnlineUsersCount = useCallback((projectId) => {
    const users = onlineUsers.get(projectId) || [];
    return users.length;
  }, [onlineUsers]);

  const value = {
    isConnected,
    currentProjectId,
    joinProject,
    leaveProject,
    getOnlineUsers,
    getOnlineUsersCount,
    onlineUsers: onlineUsers.get(currentProjectId) || []
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
