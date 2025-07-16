import express from "express";
import { getProjectMessages } from "../controller/ChatController.js";

const chatRoutes = express.Router();
chatRoutes.get("/chat", getProjectMessages);

export default chatRoutes;
