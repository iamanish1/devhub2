import express from 'express';
import {authenticateUser} from '../controller/authenticationController.js';
import { LoginUser } from '../controller/LoginUserController.js';
import githubAuthentication from '../controller/githubauthController.js';

const userRoute = express.Router() ; 

userRoute.post('/user', authenticateUser); 
userRoute.post("/login", LoginUser);
userRoute.post("/github/login", githubAuthentication) ;


export default userRoute ; 