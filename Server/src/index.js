import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDb } from "./config/connectionDB.js";
import cors from "cors";
import userRoute from "./Routes/userRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

dotenv.config();

const CorsOption = {
    origin: process.env.CLIENT_URL,
    credentials: true,
  }
  
  console.log("Frontend_Uri: " + process.env.CLIENT_URL);
  
  app.use(cors(CorsOption));
  app.use(cors({ origin: "http://localhost:8000", credentials: true }));


  // Import routes
app.use("/api", userRoute) ; 

const port = process.env.PORT || 5000;
connectDb();

app.listen(port, () => console.log(`Server running on port ${port}`));
