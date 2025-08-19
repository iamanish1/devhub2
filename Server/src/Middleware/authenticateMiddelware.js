import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import user from "../Model/UserModel.js"; 

const authMiddleware = async (req, res, next) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET environment variable is not set!");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    const authHeader = req.headers.authorization;
    console.log("🔍 Auth Header:", authHeader); // Debug auth header
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid auth header found");
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔍 Token:", token ? `${token.substring(0, 20)}...` : "No token"); // Debug token (first 20 chars)

    // 🟢 Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔍 Decoded Token:", decoded); // Debug token data

    if (!decoded.id) {
      console.log("❌ No user ID in decoded token");
      return res.status(401).json({ message: "Invalid token: Missing user ID" });
    }

    // 🟢 Convert ID if necessary
    const objectId = mongoose.Types.ObjectId.isValid(decoded.id)
      ? new mongoose.Types.ObjectId(decoded.id)
      : decoded.id;
    
    console.log("🔍 Object ID:", objectId); // Debug object ID

    // 🟢 Fetch user from DB
    const loggedInUser = await user.findById(objectId).select("-password");
    console.log("🔍 Fetched User:", loggedInUser ? `User found: ${loggedInUser.username}` : "User not found"); // Debug fetched user

    if (!loggedInUser) {
      console.log("❌ User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    req.user = loggedInUser;
    console.log("✅ Authentication successful for user:", loggedInUser.username);
    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token format" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
};

export default authMiddleware;
