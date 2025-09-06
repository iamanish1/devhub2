import ProjectListing from "../Model/ProjectListingModel.js";
import BonusPool from "../Model/BonusPoolModel.js";

// Create a basic project (only for platform administrators)
export const createBasicProject = async (req, res) => {
  try {
    const {
      project_Title,
      project_duration,
      Project_Contributor,
      Project_Number_Of_Bids,
      Project_Description,
      Project_tech_stack,
      Project_Features,
      Project_looking,
      Project_gitHub_link,
      Project_cover_photo,
      project_starting_bid,
      bonus_pool_amount,
      bonus_pool_contributors,
    } = req.body;

    // Check if user is a platform administrator
    if (!req.user.isPlatformAdmin) {
      return res.status(403).json({
        message: "Only platform administrators can create basic projects",
      });
    }

    // Handle uploaded files
    const uploadedImages = req.namedFiles ? req.namedFiles('Project_images') || [] : [];
    const coverImage = req.getFile ? req.getFile('Project_cover_photo') : null;

    // Process uploaded images
    const projectImages = uploadedImages.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size
    }));

    // Process cover image
    let coverPhotoUrl = Project_cover_photo;
    if (coverImage) {
      coverPhotoUrl = `/uploads/${coverImage.filename}`;
    }

    console.log("Creating basic project:", req.body);

    // Validate required fields
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

    const userId = req.user._id;

    // Create the basic project
    const project = new ProjectListing({
      user: userId,
      project_Title,
      project_duration,
      Project_Contributor,
      Project_Number_Of_Bids,
      Project_Description,
      Project_tech_stack,
      Project_Features,
      Project_looking,
      Project_gitHub_link,
      Project_cover_photo: coverPhotoUrl,
      Project_images: projectImages,
      project_starting_bid,
      bonus_pool_amount: bonus_pool_amount || 200,
      bonus_pool_contributors: bonus_pool_contributors || 1,
      project_category: "basic", // Always set to basic for this endpoint
      is_free_project: true, // Mark as free project
    });

    await project.save();

    // Create a pending bonus pool record for the project
    const totalBonusAmount = (bonus_pool_amount || 200) * (bonus_pool_contributors || 1);
    const bonusPool = new BonusPool({
      projectId: project._id,
      projectOwner: userId,
      totalAmount: totalBonusAmount,
      contributorCount: bonus_pool_contributors || 1,
      amountPerContributor: bonus_pool_amount || 200,
      status: 'funded', // Auto-fund for platform projects
      projectTitle: project_Title,
      isNewProject: false
    });
    await bonusPool.save();

    console.log(`[PlatformAdmin] Created basic project: ${project._id} with funded bonus pool: ${bonusPool._id}`);

    res.status(200).json({
      message: "Basic project created successfully",
      project,
      bonusPool: {
        id: bonusPool._id,
        totalAmount: bonusPool.totalAmount,
        status: bonusPool.status
      }
    });
  } catch (error) {
    console.error("Error creating basic project:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all basic projects (for platform administrators)
export const getBasicProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const filter = { project_category: "basic" };
    
    // Add search filter if provided
    if (search && search !== "") {
      filter.project_Title = {
        $regex: search,
        $options: "i",
      };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const projects = await ProjectListing.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    const total = await ProjectListing.countDocuments(filter);

    res.status(200).json({
      message: "Basic projects fetched successfully",
      projects,
      total,
    });
  } catch (error) {
    console.error("Error fetching basic projects:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};
