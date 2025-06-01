import ProjectListing from "../Model/ProjectListingModel.js"; 

export const adminAuthenticationMiddleware = async (req, res, next) => {
 try {
const  userId = req.user._id; // Assuming user ID is attached to req.user by auth middleware
const projectCount = await ProjectListing.countDocuments({ user : userId });
if (projectCount > 0) {
    console.log("🔵 Admin Authentication Successful: User has projects");
    next(); // Proceed to the next middleware or route handler
  }
    else {
        console.log("🔴 Admin Authentication Failed: User has no projects");
        return res.status(403).json({ message: "Access denied: No projects found for this user" });
    }
} catch (error) {
    console.error("🔴 Admin Authentication Error:", error);
    return res.status(500).json({ message: error.message ||"Internal server error" });
  }
 }
