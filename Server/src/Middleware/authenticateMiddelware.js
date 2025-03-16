import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import user from "../Model/UserModel.js"; 

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 🟢 Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔍 Decoded Token:", decoded); // Debug token data

    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid token: Missing user ID" });
    }

    // 🟢 Convert ID if necessary
    const objectId = mongoose.Types.ObjectId.isValid(decoded.id)
      ? new mongoose.Types.ObjectId(decoded.id)
      : decoded.id;

    // 🟢 Fetch user from DB
    const loggedInUser = await user.findById(objectId).select("-password");
    console.log("🔍 Fetched User:", loggedInUser); // Debug fetched user

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = loggedInUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
