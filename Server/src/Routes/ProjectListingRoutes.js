import express from 'express';
import ListProject, { getProject , getProjectById} from '../controller/ListProjectController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';


const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject", authMiddleware,  ListProject )
projectRoutes.get("/getlistproject", getProject)
projectRoutes.get("/getlistproject/:_id", getProjectById) // Fetch a project by ID

export default projectRoutes;