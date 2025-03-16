import express from 'express';
import {authenticateUser} from '../controller/authenticationController.js';
import { LoginUser } from '../controller/LoginUserController.js';
import githubAuthentication from '../controller/githubauthController.js';
import { GetRegisterUser } from '../controller/GetUserDetailController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
const userRoute = express.Router() ; 

userRoute.post('/user', authenticateUser); 
userRoute.post("/login", LoginUser);
userRoute.post("/github/login", githubAuthentication) ;
userRoute.get("/getuser",authMiddleware,GetRegisterUser) ; 

export default userRoute ; 