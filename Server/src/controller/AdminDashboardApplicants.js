import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";

export const getAllApplicants = async (req, res) => {
  try {
    // 1. Get all project IDs listed by this admin
    const adminId = req.user._id;
    const adminProjects = await ProjectListing.find({ user: adminId }).select(
      "_id"
    );
    const projectIds = adminProjects.map((p) => p._id);

    // 2. Get all bids for these projects
    const applicants = await Bidding.find({ project_id: { $in: projectIds } })
      .populate({
        path: "project_id",
      });

    res.status(200).json({ applicants });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch applicants", error: error.message });
  }
};

export const updateApplicantStatus = async (req, res) => {
  try {
    const { id } = req.params; // bid id
    const { status } = req.body; // "Accepted" or "Rejected"
    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const bid = await Bidding.findByIdAndUpdate(
      id,
      { bid_status: status },
      { new: true }
    )
      .populate("project_id");
    if (!bid) return res.status(404).json({ message: "Bid not found" });
    res.status(200).json({ message: "Status updated", bid });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};
