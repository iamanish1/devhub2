import ProjectListing from "../Model/ProjectListingModel.js";
import Bidding from "../Model/BiddingModel.js";
import user from "../Model/UserModel.js";

export const AdminDashboardStats = async (req, res) => {
  try {

    const totalProjects = await ProjectListing.countDocuments();
    const totalBids = await Bidding.countDocuments();
    const totalUsers = await user.countDocuments();
    const totalActiveProjects = await ProjectListing.countDocuments({ status: "active" });
    const totalCompletedProjects = await ProjectListing.countDocuments({ status: "completed" });
    const totalPendingProjects = await ProjectListing.countDocuments({ status: "pending" });

    res.status(200).json({
      totalProjects,
      totalBids,
      totalUsers,
      totalActiveProjects,
      totalCompletedProjects,
      totalPendingProjects,
    });
    
  } catch (error) {
    console.error("🔴 Error in AdminDashboard:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
