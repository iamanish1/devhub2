import express from 'express';
import { adminAuthenticationMiddleware } from '../Middleware/AdminauthenticationMiddleware.js';
import { AdminDashboardStats } from '../controller/AdminDashboardController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { AdminDashboardProjectController, EditProjectController } from '../controller/AdminDashboardProjectController.js';


const adminDashboardRoutes = express.Router();

adminDashboardRoutes.get("/overview",  authMiddleware , adminAuthenticationMiddleware , AdminDashboardStats) ; 
adminDashboardRoutes.get("/myproject", authMiddleware ,  AdminDashboardProjectController)  ; 
adminDashboardRoutes.put("/updateproject/:_id", authMiddleware , EditProjectController  )  ;

export default adminDashboardRoutes;