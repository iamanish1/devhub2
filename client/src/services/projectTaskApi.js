import axios from 'axios';
import { API_ENDPOINTS } from '../Config/api.js';

// Get auth token
const getAuthToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
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
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_TASK(projectId),
        taskData
      );
      return response.data;
    } catch (error) {
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
  }
};

export default projectTaskApi;
