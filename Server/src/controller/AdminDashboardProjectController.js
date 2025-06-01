import ProjectListing from "../Model/ProjectListingModel.js";
import Bidding from "../Model/BiddingModel.js";
import UserProfile from "../Model/UserProfileModel.js";

export const AdminDashboardProjectController = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not found in request" });
    }
    const userId = req.user._id;

    // 1. Get all projects listed by this user
    const userProjects = await ProjectListing.find({ user: userId });

    // 2. For each project, get bids and bidder profile
    const projectWithBids = await Promise.all(
      userProjects.map(async (project) => {
        const bids = await Bidding.find({ project_id: project._id }).lean();

        // get user profile for each bid
        const bidsWithUserProfile = await Promise.all(
          bids.map(async (bid) => {
            const userIdForProfile = bid.user || bid.user_id;
            let userProfile = null;
            if (userIdForProfile) {
              userProfile = await UserProfile.findOne(
                { username: userIdForProfile },
                // Select all relevant fields from your UserProfile schema
                "username user_profile_email user_profile_usertype user_profile_skills user_profile_bio user_project_contribution user_completed_projects user_profile_cover_photo user_profile_linkedIn user_profile_github user_profile_website user_profile_instagram user_profile_location user_profile_created_at user_profile_recent_project"
              ).lean();
            }
            return {
              ...bid,
              bidderProfile: userProfile,
            };
          })
        );
        return {
          ...project.toObject(),
          bids: bidsWithUserProfile,
        };
      })
    );

    return res.status(200).json({ projects: projectWithBids });
  } catch (error) {
    console.error("🔴 Error in AdminDashboardProjectController:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Edit Project  controller

export const EditProjectController = async (req, res) => {
  try {
    const { id } = req.params;
    // Destructure to exclude Project_cover_photo (or any file field)
    const {
      Project_cover_photo, // exclude this
      ...updatedData
    } = req.body;

    const project = await ProjectListing.findByIdAndUpdate(_id, updatedData, {
      new: true,
    });
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("🔴 Error in EditProjectController:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const DeleteProjectController = async (req, res) => {
  try {
    const { id } = req.params; // Use 'id' as the route param
    const deletedProject = await ProjectListing.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Optionally, delete all related bids
    await Bidding.deleteMany({ project_id: id });

    res.status(200).json({
      message: "Project deleted successfully",
      project: deletedProject,
    });
  } catch (error) {
    console.error("🔴 Error in DeleteProjectController:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
