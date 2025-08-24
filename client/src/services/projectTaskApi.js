import axios from 'axios';
import { API_ENDPOINTS } from '../Config/api.js';

// Get auth token
const getAuthToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  console.log('🔍 Auth token:', token ? `${token.substring(0, 20)}...` : 'No token');
  
  const instance = axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Add request interceptor for debugging
  instance.interceptors.request.use(
    (config) => {
      console.log('🔍 Making request to:', config.url);
      console.log('🔍 Request method:', config.method);
      console.log('🔍 Request headers:', config.headers);
      return config;
    },
    (error) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );
  
  return instance;
};

/**
 * Project Task API Service
 * Handles all project task and workspace related API calls
 */
export const projectTaskApi = {
  /**
   * Create project workspace
   */
  createWorkspace: async (projectId, workspaceData) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_WORKSPACE(projectId),
        workspaceData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project workspace
   */
  getWorkspace: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_WORKSPACE(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new task
   */
  createTask: async (projectId, taskData) => {
    try {
      console.log('🔍 Creating task for project:', projectId);
      console.log('🔍 Task data:', taskData);
      console.log('🔍 API endpoint:', API_ENDPOINTS.CREATE_TASK(projectId));
      
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_TASK(projectId),
        taskData
      );
      console.log('✅ Task created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      console.error('❌ Error response:', error.response);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update task
   */
  updateTask: async (projectId, taskId, updateData) => {
    try {
      const response = await createAuthInstance().put(
        API_ENDPOINTS.UPDATE_TASK(projectId, taskId),
        updateData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Complete task
   */
  completeTask: async (projectId, taskId, completionData) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.COMPLETE_TASK(projectId, taskId),
        completionData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Add comment to task
   */
  addTaskComment: async (projectId, taskId, content) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.ADD_TASK_COMMENT(projectId, taskId),
        { content }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Upload file to task
   */
  uploadTaskFile: async (projectId, taskId, fileData) => {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('title', fileData.title || '');
      formData.append('description', fileData.description || '');
      formData.append('isPublic', fileData.isPublic || true);
      formData.append('tags', JSON.stringify(fileData.tags || []));

      const response = await createAuthInstance().post(
        API_ENDPOINTS.UPLOAD_TASK_FILE(projectId, taskId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get user's tasks
   */
  getUserTasks: async (filters = {}) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_USER_TASKS,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project statistics
   */
  getProjectStatistics: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_STATISTICS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (projectId, taskId) => {
    try {
      const response = await createAuthInstance().delete(
        API_ENDPOINTS.DELETE_TASK(projectId, taskId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default projectTaskApi;
