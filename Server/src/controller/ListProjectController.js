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
    } = req.body;

    if (
      (!project_Title ||
      !project_duration ||
      !Project_Bid_Amount ||
      !Project_Contributor ||
      !Project_Number_Of_Bids ||
      !Project_Description ||
      !Project_tech_stack ||
      !Project_Features ||
      !Project_looking ||
      !Project_gitHub_link ||
      !Project_cover_photo)
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
    // Create new project listing
    const project = new ProjectListing({
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



export const getProject = async (req, res)=>{
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
}