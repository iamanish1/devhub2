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

  // Project Selection System endpoints
  PROJECT_SELECTION_BASE: `${API_BASE_URL}/api/project-selection`,
  CREATE_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}`,
  GET_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}`,
  EXECUTE_AUTOMATIC_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/execute-automatic`,
  MANUAL_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/manual-selection`,
  GET_RANKED_BIDDERS: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/ranked-bidders`,
  UPDATE_SELECTION_CONFIG: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/config`,
  GET_PROJECT_OWNER_SELECTIONS: `${API_BASE_URL}/api/project-selection/owner/selections`,
  CANCEL_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/cancel`,

  // Escrow Wallet System endpoints
  ESCROW_BASE: `${API_BASE_URL}/api/escrow`,
  CREATE_ESCROW: (projectId) => `${API_BASE_URL}/api/escrow/create/${projectId}`,
  GET_ESCROW: (projectId) => `${API_BASE_URL}/api/escrow/${projectId}`,
  LOCK_USER_FUNDS: (projectId, userId, bidId) => `${API_BASE_URL}/api/escrow/${projectId}/lock/${userId}/${bidId}`,
  RELEASE_USER_FUNDS: (projectId, userId, bidId) => `${API_BASE_URL}/api/escrow/${projectId}/release/${userId}/${bidId}`,
  REFUND_USER_FUNDS: (projectId, userId, bidId) => `${API_BASE_URL}/api/escrow/${projectId}/refund/${userId}/${bidId}`,
  COMPLETE_PROJECT: (projectId) => `${API_BASE_URL}/api/escrow/${projectId}/complete`,
  GET_PROJECT_OWNER_ESCROWS: `${API_BASE_URL}/api/escrow/owner/escrows`,
  GET_ESCROW_STATS: `${API_BASE_URL}/api/escrow/owner/stats`,

  // Project Task System endpoints
  PROJECT_TASKS_BASE: `${API_BASE_URL}/api/project-tasks`,
  CREATE_WORKSPACE: (projectId) => `${API_BASE_URL}/api/project-tasks/workspace/${projectId}`,
  GET_WORKSPACE: (projectId) => `${API_BASE_URL}/api/project-tasks/workspace/${projectId}`,
  CREATE_TASK: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks`,
  UPDATE_TASK: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}`,
  COMPLETE_TASK: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/complete`,
  ADD_TASK_COMMENT: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/comments`,
  UPLOAD_TASK_FILE: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/files`,
  GET_USER_TASKS: `${API_BASE_URL}/api/project-tasks/user/tasks`,
  GET_PROJECT_STATISTICS: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/statistics`,
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
