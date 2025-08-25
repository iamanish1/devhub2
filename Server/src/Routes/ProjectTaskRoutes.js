import express from 'express';
import { 
  checkWorkspaceAccess, 
  getWorkspace, 
  debugProjectAccess, 
  debugProjectBids,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reviewTask,
  addTaskComment,
  uploadTaskFile,
  getUserTasks,
  getProjectTasks,
  getProjectStatistics,
  getTeamMembers,
  createWorkspace,
  updateWorkspace,
  uploadProjectResource,
  getProjectResources,
  deleteProjectResource,
  updateProjectResource,
  getProjectChunks,
  createFirebaseAccess
} from '../controller/ProjectTaskController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import upload from '../Middleware/upload.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const projectTaskRoutes = express.Router();

// Test endpoint to verify route is working
projectTaskRoutes.get('/test', (req, res) => {
  res.json({ message: 'Project task routes are working' });
});

// Test endpoint for team route (without auth for debugging)
projectTaskRoutes.get('/test-team/:projectId', (req, res) => {
  console.log('🔍 Test team endpoint hit');
  console.log('🔍 Project ID:', req.params.projectId);
  res.json({ 
    message: 'Test team endpoint working',
    projectId: req.params.projectId,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for resources route (without auth for debugging)
projectTaskRoutes.get('/test-resources/:projectId', (req, res) => {
  console.log('🔍 Test resources endpoint hit');
  console.log('🔍 Project ID:', req.params.projectId);
  res.json({ 
    message: 'Test resources endpoint working',
    projectId: req.params.projectId,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to add sample resources
projectTaskRoutes.post('/test-add-resources/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    
    console.log('🔍 Adding sample resources for project:', projectId);
    
    // Check if Firebase is available
    if (!db) {
      return res.status(500).json({ message: 'Firebase not configured' });
    }
    
    // Sample resources to add
    const sampleResources = [
      {
        projectId,
        name: 'Project Requirements Document',
        type: 'document',
        description: 'Detailed project requirements and specifications',
        url: 'https://example.com/requirements.pdf',
        uploadedBy: userId.toString(),
        uploadedAt: serverTimestamp()
      },
      {
        projectId,
        name: 'Design Mockups',
        type: 'image',
        description: 'UI/UX design mockups and wireframes',
        url: 'https://example.com/mockups.zip',
        uploadedBy: userId.toString(),
        uploadedAt: serverTimestamp()
      },
      {
        projectId,
        name: 'API Documentation',
        type: 'document',
        description: 'API endpoints and integration guide',
        url: 'https://example.com/api-docs.pdf',
        uploadedBy: userId.toString(),
        uploadedAt: serverTimestamp()
      }
    ];
    
    // Add resources to Firebase
    const resourceRef = collection(db, 'project_resources');
    const addedResources = [];
    
    for (const resource of sampleResources) {
      const newResource = await addDoc(resourceRef, resource);
      addedResources.push({
        id: newResource.id,
        ...resource
      });
    }
    
    console.log('✅ Sample resources added:', addedResources.length);
    
    res.status(200).json({
      success: true,
      message: 'Sample resources added successfully',
      resources: addedResources
    });
    
  } catch (error) {
    console.error('❌ Error adding sample resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add sample resources',
      error: error.message
    });
  }
});

// Test endpoint for task creation (without auth for debugging)
projectTaskRoutes.post('/test-task/:projectId', (req, res) => {
  console.log('🔍 Test task endpoint hit');
  console.log('🔍 Project ID:', req.params.projectId);
  console.log('🔍 Request body:', req.body);
  res.json({ 
    message: 'Test task endpoint working',
    projectId: req.params.projectId,
    body: req.body
  });
});

// User-specific routes (must come before parameterized routes)
projectTaskRoutes.get('/user/tasks', authMiddleware, getUserTasks);

// Specific routes (must come before parameterized routes)
projectTaskRoutes.get('/chunks/:projectId', authMiddleware, getProjectChunks);
projectTaskRoutes.post('/firebase-access/:projectId', authMiddleware, createFirebaseAccess);

// Workspace management
projectTaskRoutes.post('/workspace/:projectId', authMiddleware, createWorkspace);
projectTaskRoutes.get('/workspace/:projectId', authMiddleware, getWorkspace);
projectTaskRoutes.put('/workspace/:projectId', authMiddleware, updateWorkspace);
projectTaskRoutes.get('/workspace/:projectId/check-access', authMiddleware, checkWorkspaceAccess);

// Task management
projectTaskRoutes.get('/:projectId/get-tasks', authMiddleware, getProjectTasks);
projectTaskRoutes.post('/:projectId/tasks', authMiddleware, createTask);
projectTaskRoutes.put('/:projectId/tasks/:taskId', authMiddleware, updateTask);
projectTaskRoutes.delete('/:projectId/tasks/:taskId', authMiddleware, deleteTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/complete', authMiddleware, completeTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/review', authMiddleware, reviewTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/comments', authMiddleware, addTaskComment);
projectTaskRoutes.post('/:projectId/tasks/:taskId/files', authMiddleware, upload.single('file'), uploadTaskFile);

// Resource management
projectTaskRoutes.post('/:projectId/resources', authMiddleware, upload.single('file'), uploadProjectResource);
projectTaskRoutes.get('/:projectId/resources', authMiddleware, getProjectResources);
projectTaskRoutes.put('/:projectId/resources/:resourceId', authMiddleware, updateProjectResource);
projectTaskRoutes.delete('/:projectId/resources/:resourceId', authMiddleware, deleteProjectResource);

// Project-specific routes
projectTaskRoutes.get('/:projectId/statistics', authMiddleware, getProjectStatistics);
projectTaskRoutes.get('/:projectId/team', authMiddleware, getTeamMembers);

// Debug endpoints
projectTaskRoutes.get('/debug/:projectId', authMiddleware, debugProjectAccess);
projectTaskRoutes.get('/debug/:projectId/bids', authMiddleware, debugProjectBids);

export default projectTaskRoutes;
