import ProjectListing from "../Model/ProjectListingModel.js";
const ListProject = async (req, res) => {
  try {
    const {
      project_Title,
      project_duration,
      Project_Bid_Amount,
      Project_Contributor,
      Project_Number_Of_Bids,
      Project_Description,
      Project_tech_stack,
      Project_Features,
      Project_looking,
      Project_gitHub_link,
      Project_cover_photo,
      project_starting_bid,
    } = req.body;

    console.log("Received project data:", req.body);

    if (
      !project_Title ||
      !project_duration ||
      !project_starting_bid ||
      !Project_Contributor ||
      !Project_Number_Of_Bids ||
      !Project_Description ||
      !Project_tech_stack ||
      !Project_Features ||
      !Project_looking ||
      !Project_gitHub_link
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    // Check for duplicate project
    const existingProject = await ProjectListing.findOne({ project_Title });
    if (existingProject) {
      return res.status(400).json({
        message: "A project with this title already exists",
      });
    }
    const userId = req.user._id; // Get the user ID from the authenticated user

    const project = new ProjectListing({
      user: userId, // <-- Use 'user' if your schema expects 'user'
      project_Title,
      project_duration,
      Project_Bid_Amount,
      Project_Contributor,
      Project_Number_Of_Bids,
      Project_Description,
      Project_tech_stack,
      Project_Features,
      Project_looking,
      Project_gitHub_link,
      Project_cover_photo,
      project_starting_bid,
    });
    await project.save();
    res.status(200).json({
      message: "Project listed successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export default ListProject;

export const getProject = async (req, res) => {
  try {
    const project = await ProjectListing.find();
    res.status(200).json({
      message: "Project fetched successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Fetch a project by ID
export const getProjectById = async (req, res) => {
  try {
    const { _id } = req.params; // Extract project ID from request parameters
    const project = await ProjectListing.findById(_id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json({
      message: "Project fetched successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
