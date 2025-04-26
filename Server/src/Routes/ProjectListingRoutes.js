import express from 'express';
import ListProject, { getProject , getProjectById} from '../controller/ListProjectController.js';


const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject",  ListProject )
projectRoutes.get("/getlistproject", getProject)
projectRoutes.get("/getlistproject/:_id", getProjectById) // Fetch a project by ID

export default projectRoutes;