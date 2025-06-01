import ProjectListing from "../Model/ProjectListingModel.js";
import Bidding from "../Model/BiddingModel.js";
import user from "../Model/UserModel.js";

export const AdminDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get all project IDs listed by this user
    const userProjects = await ProjectListing.find({ user: userId }, "_id");
    const projectIds = userProjects.map((p) => p._id);

    // 2. Count all bids on these projects (by any user)
    const totalBids = await Bidding.countDocuments({
      project_id: { $in: projectIds },
    });

    const totalProjects = projectIds.length;
    const totalUsers = 1; // Only the logged-in user

    const totalActiveProjects = await ProjectListing.countDocuments({
      user: userId,
      status: "active",
    });
    const totalCompletedProjects = await ProjectListing.countDocuments({
      user: userId,
      status: "completed",
    });
    const totalPendingProjects = await ProjectListing.countDocuments({
      user: userId,
      status: "pending",
    });

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
