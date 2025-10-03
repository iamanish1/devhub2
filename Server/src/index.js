import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDb } from "./config/connectionDB.js";
import cors from "cors";
import mongoose from "mongoose";
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
import projectSelectionRoutes from "./Routes/ProjectSelectionRoutes.js";
import escrowWalletRoutes from "./Routes/EscrowWalletRoutes.js";
import projectTaskRoutes from "./Routes/ProjectTaskRoutes.js";
import platformAdminRoutes from "./Routes/PlatformAdminRoutes.js";
import path from "path";


dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('⚠️ Server may not function properly without these variables');
}

// Log environment status
console.log('📋 Environment Variables Status:');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('  FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('  FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('  FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  PORT:', process.env.PORT || 5000);

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const CorsOption = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://www.devhubs.in',
      'https://www.devhubs.in',
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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Serve uploaded files statically
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadsDir))); 

// Health check endpoint (moved to top for faster response)
app.get('/api/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      version: process.version,
      port: process.env.PORT || 5000
    };
    
    console.log("🏥 Health check requested:", healthStatus);
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error("❌ Health check error:", error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'DevHubs API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});
 

// Import routes
app.use("/api", userRoute) ; 
app.use("/api/bid", biddingRoutes) ;
app.use("/api/admin", adminDashboardRoutes) ; 
app.use("/api/notes", userNoteRoute ) ;
app.use("/api", uploadRoutes) ;
app.use("/api/saved-projects", savedProjectRoutes);
app.use("/api/user-projects", userProjectsRoutes);

// Payment routes
app.use("/api/payments", paymentsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/projects", projectsPaymentRoutes);

// Project selection routes
app.use("/api/project-selection", projectSelectionRoutes);
console.log("✅ Project Selection routes registered at /api/project-selection");

// Escrow wallet routes
app.use("/api/escrow", escrowWalletRoutes);

// Project task routes (must come before general project routes to avoid conflicts)
app.use("/api/project-tasks", projectTaskRoutes);
console.log("✅ Project Task routes registered at /api/project-tasks");

// Project routes (must come after project-tasks to avoid conflicts)
app.use("/api/project", projectRoutes) ; 

// Platform admin routes
app.use("/api/platform-admin", platformAdminRoutes);
console.log("✅ Platform Admin routes registered at /api/platform-admin");

app.use("/api", chatRoutes);
console.log("✅ Chat routes registered at /api/chat");

// Initialize chat socket
chatSocket(io);

const port = process.env.PORT || 5000;

// Add error handling for server startup
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
});

// Start server with proper error handling
const startServer = async () => {
  try {
    console.log("🚀 Starting DevHubs API Server...");
    console.log("📋 Environment:", process.env.NODE_ENV || 'development');
    console.log("🔗 Port:", port);
    
    // Start the server first
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🏥 Health check available at: http://localhost:${port}/api/health`);
      console.log(`📊 Root endpoint: http://localhost:${port}/`);
    });
    
    // Then try to connect to database (non-blocking)
    try {
      await connectDb();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.log('⚠️ Server is running without database connection');
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
