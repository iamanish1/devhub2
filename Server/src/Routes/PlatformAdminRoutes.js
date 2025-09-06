import express from 'express';
import { createBasicProject, getBasicProjects } from '../controller/PlatformAdminController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { uploadFields, normalizeFiles } from '../Middleware/upload.js';

const platformAdminRoutes = express.Router();

// Platform admin routes
platformAdminRoutes.post("/create-basic-project", 
  authMiddleware, 
  uploadFields([
    { name: 'Project_cover_photo', maxCount: 1 },
    { name: 'Project_images', maxCount: 10 }
  ]), 
  normalizeFiles,
  createBasicProject
);

platformAdminRoutes.get("/basic-projects", 
  authMiddleware, 
  getBasicProjects
);

export default platformAdminRoutes;
