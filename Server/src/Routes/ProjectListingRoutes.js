import express from 'express';
import ListProject, { getProject , getProjectById, testFormData} from '../controller/ListProjectController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { uploadFields, normalizeFiles } from '../Middleware/upload.js';



const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject", 
  authMiddleware, 
  uploadFields([
    { name: 'Project_cover_photo', maxCount: 1 },
    { name: 'Project_images', maxCount: 10 }
  ]), 
  normalizeFiles,
  ListProject 
)

// Test endpoint for debugging
projectRoutes.post("/test-formdata", 
  uploadFields([
    { name: 'Project_cover_photo', maxCount: 1 },
    { name: 'Project_images', maxCount: 10 }
  ]), 
  normalizeFiles,
  testFormData 
)

projectRoutes.get("/getlistproject", getProject)
projectRoutes.get("/getlistproject/:_id", getProjectById) // Fetch a project by ID

export default projectRoutes;