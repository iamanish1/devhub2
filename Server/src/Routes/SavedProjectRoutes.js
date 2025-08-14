import express from 'express';
import { saveProject, unsaveProject, getSavedProjects, checkIfSaved } from '../controller/SavedProjectController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const savedProjectRoutes = express.Router();

// Save a project
savedProjectRoutes.post("/save/:projectId", authMiddleware, saveProject);

// Unsave a project
savedProjectRoutes.delete("/unsave/:projectId", authMiddleware, unsaveProject);

// Get user's saved projects
savedProjectRoutes.get("/saved", authMiddleware, getSavedProjects);

// Check if project is saved by user
savedProjectRoutes.get("/check/:projectId", authMiddleware, checkIfSaved);

export default savedProjectRoutes;
