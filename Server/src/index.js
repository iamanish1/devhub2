import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDb } from "./config/connectionDB.js";
import cors from "cors";
import userRoute from "./Routes/userRoutes.js";
import projectRoutes from "./Routes/ProjectListingRoutes.js";
import biddingRoutes from "./Routes/BiddingRoutes.js";
import adminDashboardRoutes from "./Routes/AdminDashboardRoute.js";
import http from "http";
import { Server } from "socket.io";
import chatSocket from "./sockets/chatSockte.js"; // Import the chat socket
import chatRoutes from "./Routes/ChatRoutes.js";

// Initialize express app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // or your frontend URL
    credentials: true,
  },
});



app.use(express.json());
app.use(cookieParser());

dotenv.config();

const CorsOption = {
  origin: process.env.CLIENT_URL,
  credentials: true,
}
  console.log("Frontend_Uri: " + process.env.CLIENT_URL);
app.use(cors(CorsOption)) ; 

  // Import routes
app.use("/api", userRoute) ; 
app.use("/api/project", projectRoutes) ; 
app.use("/api/bid", biddingRoutes) ;
app.use("/api/admin", adminDashboardRoutes) ; 
app.use("/api/project",chatRoutes);

// Initialize chat socket
chatSocket(io);

const port = process.env.PORT || 5000;
connectDb();

server.listen(port, () => console.log(`Server running on port ${port}`));
