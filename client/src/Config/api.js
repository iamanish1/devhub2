// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Socket server URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // User endpoints
  GET_USER: `${API_BASE_URL}/api/getuser`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Project endpoints
  GET_PROJECTS: `${API_BASE_URL}/api/project/getlistproject`,
  GET_PROJECT: (id) => `${API_BASE_URL}/api/project/getlistproject/${id}`,
  
  // Bidding endpoints
  GET_BID: (id) => `${API_BASE_URL}/api/bid/getBid/${id}`,
  CREATE_BID: (id) => `${API_BASE_URL}/api/bid/createBid/${id}`,
  
  // Saved projects
  CHECK_SAVED: (id) => `${API_BASE_URL}/api/saved-projects/check/${id}`,
  SAVE_PROJECT: (id) => `${API_BASE_URL}/api/saved-projects/save/${id}`,
  UNSAVE_PROJECT: (id) => `${API_BASE_URL}/api/saved-projects/unsave/${id}`,
  
  // Admin endpoints
  ADMIN_APPLICANTS: `${API_BASE_URL}/api/admin/applicant`,
  ADMIN_PROJECTS: `${API_BASE_URL}/api/admin/myproject`,
  ADMIN_OVERVIEW: `${API_BASE_URL}/api/admin/overview`,
  ADMIN_DELETE_PROJECT: (id) => `${API_BASE_URL}/api/admin/deleteproject/${id}`,
  ADMIN_UPDATE_APPLICANT: (id) => `${API_BASE_URL}/api/admin/applicant/${id}`,
  ADMIN_PROJECT_TASK: `${API_BASE_URL}/api/admin/projecttask`,
  ADMIN_EDIT_PROJECT_TASK: (id) => `${API_BASE_URL}/api/admin/editprojecttask/${id}`,
  ADMIN_DELETE_PROJECT_TASK: (id) => `${API_BASE_URL}/api/admin/deleteprojecttask/${id}`,
  
  // Chat endpoints
  GET_CHAT: (id) => `${API_BASE_URL}/api/project/chat/${id}`,
  
  // Upload endpoints
  UPLOAD_AVATAR: `${API_BASE_URL}/api/uploads/single/avatar`,
  
  // User projects
  USER_PROJECTS_BASE: `${API_BASE_URL}/api/user-projects`,
};

// File URLs
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

// Socket configuration
export const SOCKET_CONFIG = {
  url: SOCKET_SERVER_URL,
  options: {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  }
};

export default API_BASE_URL;
