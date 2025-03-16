import jwt from "jsonwebtoken";
import user from "../Model/UserModel.js"; // ✅ Using "user" (as per your model)

const authMiddleware = async (req, res, next) => {
  try {
    // 🟢 Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 🟢 Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🟢 Fetch user from DB and attach to req.user
    const loggedInUser = await user.findById(decoded.id).select("-password"); // ✅ Correct variable name
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = loggedInUser; // ✅ Now correctly attaching user data
    next(); // ✅ Proceed to next middleware/controller
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
