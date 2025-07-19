import express from "express" ; 
import { saveUserNote  , getUserNotes} from "../controller/UserNoteController.js";

const userNoteRoute = express.Router();

userNoteRoute.post("/usernotes/:projectId", saveUserNote) ; 
userNoteRoute.get("/getusernotes/:projectId", getUserNotes) ;

export default userNoteRoute;