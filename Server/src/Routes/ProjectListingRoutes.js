import express from 'express';
import ListProject from '../controller/ListProjectController.js';


const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject",  ListProject )

export default projectRoutes;