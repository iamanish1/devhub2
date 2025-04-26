import express from 'express';
import ListProject, { getProject } from '../controller/ListProjectController.js';


const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject",  ListProject )
projectRoutes.get("/getlistproject", getProject)
projectRoutes.get("/getlistproject/:id", getProject) // Fetch a project by ID

export default projectRoutes;