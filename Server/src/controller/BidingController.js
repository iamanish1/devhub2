import Bidding from "../Model/BiddingModel.js";
import ProjectListing  from "../Model/ProjectListingModel.js"; // Import the ProjectListing model
import user from "../Model/UserModel.js"; // Import the User model
export const createBid = async (req, res) => {
  try {
    const { projectId } = req.params; // Extract projectId from request parameters
    const { userID } = req.user._id;
    const {
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
    } = req.body; // Extract bid details from request body

    // Check if the project exists
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the user exists
    const User = await user.findById(userID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if the user has already placed a bid on this project
    const existingBid = await Bidding.findOne({ project_id: projectId, user_id: userID });
    if (existingBid) {
      return res.status(400).json({ message: "You have already placed a bid on this project" });
    }

    // Create a new bid
    const newBid = new Bidding({
      project_id: project._id,
      user_id: user._id,
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
    });

    await newBid.save();
    res.status(201).json({ message: "Bid created successfully", bid: newBid });
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
