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
import userNoteRoute from "./Routes/UserNotesRoute.js";
import uploadRoutes from "./Routes/upload.routes.js";
import savedProjectRoutes from "./Routes/SavedProjectRoutes.js";
import userProjectsRoutes from "./Routes/UserProjectsRoutes.js";
import paymentsRoutes from "./Routes/paymentsRoutes.js";
import webhooksRoutes from "./Routes/webhooksRoutes.js";
import projectsPaymentRoutes from "./Routes/projectsPaymentRoutes.js";
import path from "path";


dotenv.config();

// Initialize express app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://www.devhubs.in',
      'https://www.devhubs.in/',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
  },
});



app.use(express.json());
app.use(cookieParser());


const CorsOption = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://www.devhubs.in',
      'https://www.devhubs.in/',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}
  console.log("Frontend_Uri: " + process.env.CLIENT_URL);
  console.log("All Environment Variables:");
  console.log("CLIENT_URL:", process.env.CLIENT_URL);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("CORS Configuration: Allowing origins:", [
    'https://www.devhubs.in',
    'https://www.devhubs.in/',
    'http://localhost:5173',
    'http://localhost:3000'
  ]);
app.use(cors(CorsOption)) ;

// Serve uploaded files statically
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadsDir))); 



// Import routes
app.use("/api", userRoute) ; 
app.use("/api/project", projectRoutes) ; 
app.use("/api/bid", biddingRoutes) ;
app.use("/api/admin", adminDashboardRoutes) ; 
app.use("/api/project",chatRoutes);
app.use("/api/notes", userNoteRoute ) ;
app.use("/api", uploadRoutes) ;
app.use("/api/saved-projects", savedProjectRoutes);
app.use("/api/user-projects", userProjectsRoutes);

// Payment routes
app.use("/api/payments", paymentsRoutes);
app.use("/webhooks", webhooksRoutes);
app.use("/api/projects", projectsPaymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
 

// Initialize chat socket
chatSocket(io);

const port = process.env.PORT || 5000;
connectDb();

server.listen(port, () => console.log(`Server running on port ${port}`));
