import express from 'express';
import { adminAuthenticationMiddleware } from '../Middleware/AdminauthenticationMiddleware.js';
import { AdminDashboardStats } from '../controller/AdminDashboardController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { AdminDashboardProjectController, DeleteProjectController, EditProjectController } from '../controller/AdminDashboardProjectController.js';
import { getAllApplicants, updateApplicantStatus } from '../controller/AdminDashboardApplicants.js';
import { createProjectTask, getProjectTasks } from '../controller/AdminProjectTaskController.js';


const adminDashboardRoutes = express.Router();

adminDashboardRoutes.get("/overview",  authMiddleware , adminAuthenticationMiddleware , AdminDashboardStats) ; 
adminDashboardRoutes.get("/myproject", authMiddleware ,  AdminDashboardProjectController)  ; 
adminDashboardRoutes.put("/updateproject/:_id", authMiddleware , EditProjectController  )  ;
adminDashboardRoutes.delete("/deleteproject/:id", authMiddleware , DeleteProjectController  )  ;
adminDashboardRoutes.get("/applicant", authMiddleware , adminAuthenticationMiddleware , getAllApplicants ) ; 
adminDashboardRoutes.put("/applicant/:id", authMiddleware , adminAuthenticationMiddleware , updateApplicantStatus ) ;
adminDashboardRoutes.post("/projecttask", authMiddleware , adminAuthenticationMiddleware , createProjectTask  ) ;
adminDashboardRoutes.get("/getprojecttask/:projectId", authMiddleware , adminAuthenticationMiddleware , getProjectTasks  ) ;

export default adminDashboardRoutes;