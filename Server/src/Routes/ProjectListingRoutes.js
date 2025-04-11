import express from 'express';
import ListProject, { getProject } from '../controller/ListProjectController.js';


const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject",  ListProject )
projectRoutes.get("/getlistproject", getProject)

export default projectRoutes;