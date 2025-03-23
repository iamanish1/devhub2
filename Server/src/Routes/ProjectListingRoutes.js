import express from 'express';
import ProjectListing from '../controller/ProjectListingController.js';

const projectRoutes = express.Router() ; 

projectRoutes.post("/listproject", ProjectListing) ; 


export default projectRoutes;