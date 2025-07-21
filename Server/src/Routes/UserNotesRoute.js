import express from "express" ; 
import { saveUserNote  , getUserNotes, deleteUserNote} from "../controller/UserNoteController.js";

const userNoteRoute = express.Router();

userNoteRoute.post("/usernotes/:projectId", saveUserNote) ; 
userNoteRoute.get("/getusernotes/:projectId", getUserNotes) ;
userNoteRoute.delete("/deleteusernote/:projectId", deleteUserNote) ;

export default userNoteRoute;