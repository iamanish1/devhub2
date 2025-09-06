import ProjectListing from "../Model/ProjectListingModel.js";
import BonusPool from "../Model/BonusPoolModel.js";

const ListProject = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request headers:", req.headers);
    
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
      bonus_pool_amount,
      bonus_pool_contributors,
      project_category,
      is_free_project,
    } = req.body;

    // Handle uploaded files
    console.log('Debug - req.files:', req.files);
    console.log('Debug - req.file:', req.file);
    console.log('Debug - req.namedFiles function:', typeof req.namedFiles);
    
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

    console.log('Uploaded files:', {
      coverImage: coverImage?.filename,
      images: projectImages.length
    });

    console.log("Received project data:", req.body);
    console.log("User info:", { 
      userId: req.user?._id, 
      isPlatformAdmin: req.user?.isPlatformAdmin,
      project_category 
    });

    // Check if user is trying to list a free project (only platform can do this)
    if (project_category === "free" && !req.user.isPlatformAdmin) {
      return res.status(403).json({
        message: "Only platform administrators can list free projects",
      });
    }

    // Auto-categorize projects based on funding status
    let finalProjectCategory = project_category;
    if (project_category === "free") {
      finalProjectCategory = "free"; // Free projects stay as free
    } else if (bonus_pool_amount && bonus_pool_amount > 0) {
      finalProjectCategory = "funded"; // Projects with bonus pool are funded
    } else if (!project_category || project_category === "funded") {
      finalProjectCategory = "funded"; // Default to funded for paid projects
    }

    // Basic validation for all projects
    if (
      !project_Title ||
      !Project_Description ||
      !Project_tech_stack ||
      !Project_gitHub_link
    ) {
      return res.status(400).json({
        message: "Project title, description, tech stack, and GitHub link are required",
      });
    }

    // Additional validation for non-free projects
    if (finalProjectCategory !== "free") {
      if (
        !project_duration ||
        !project_starting_bid ||
        !Project_Contributor ||
        !Project_Number_Of_Bids ||
        !Project_Features ||
        !Project_looking
      ) {
        return res.status(400).json({
          message: "All fields are required for funded and basic projects",
        });
      }
    }
    // Check for duplicate project
    const existingProject = await ProjectListing.findOne({ project_Title });
    if (existingProject) {
      return res.status(400).json({
        message: "A project with this title already exists",
      });
    }
    const userId = req.user._id; // Get the user ID from the authenticated user

    // Set default values for free projects
    const projectData = {
      user: userId,
      project_Title,
      Project_Description,
      Project_tech_stack,
      Project_gitHub_link,
      Project_cover_photo: coverPhotoUrl,
      Project_images: projectImages,
      project_category: finalProjectCategory,
      is_free_project: finalProjectCategory === "free",
    };

    // Add fields based on project type
    if (finalProjectCategory === "free") {
      // Free projects have minimal required fields with defaults
      projectData.project_duration = project_duration ? new Date(project_duration) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      projectData.project_starting_bid = 0;
      projectData.Project_Contributor = 1;
      projectData.Project_Number_Of_Bids = 1;
      projectData.Project_Features = Project_Features || "Free project for resume building";
      projectData.Project_looking = Project_looking || "Open to all developers";
      projectData.bonus_pool_amount = 0;
      projectData.bonus_pool_contributors = 0;
    } else {
      // Regular projects require all fields
      projectData.project_duration = new Date(project_duration);
      projectData.Project_Contributor = parseInt(Project_Contributor);
      projectData.Project_Number_Of_Bids = parseInt(Project_Number_Of_Bids);
      projectData.Project_Features = Project_Features;
      projectData.Project_looking = Project_looking;
      projectData.project_starting_bid = parseInt(project_starting_bid);
      projectData.bonus_pool_amount = parseInt(bonus_pool_amount) || 200;
      projectData.bonus_pool_contributors = parseInt(bonus_pool_contributors) || 1;
    }

    console.log("Creating project with data:", projectData);
    
    const project = new ProjectListing(projectData);
    await project.save();
    
    console.log("Project created successfully:", project._id);

    let bonusPool = null;
    let responseData = {
      message: finalProjectCategory === "free" ? "Free project created successfully" : "Project listed successfully",
      project,
    };

    // Only create bonus pool for non-free projects
    if (finalProjectCategory !== "free") {
      // Create a pending bonus pool record for the project
      const totalBonusAmount = (bonus_pool_amount || 200) * (bonus_pool_contributors || 1);
      bonusPool = new BonusPool({
        projectId: project._id,
        projectOwner: userId,
        totalAmount: totalBonusAmount,
        contributorCount: bonus_pool_contributors || 1,
        amountPerContributor: bonus_pool_amount || 200,
        status: 'pending', // Will be updated to 'funded' when payment is completed
        projectTitle: project_Title,
        isNewProject: false
      });
      await bonusPool.save();

      console.log(`[ProjectListing] Created project: ${project._id} with pending bonus pool: ${bonusPool._id}`);

      // For testing purposes, automatically fund the bonus pool
      // TODO: Remove this in production and integrate with actual payment flow
      bonusPool.status = 'funded';
      bonusPool.fundedAt = new Date();
      await bonusPool.save();
      console.log(`[ProjectListing] Auto-funded bonus pool for testing: ${bonusPool._id}`);

      responseData.bonusPool = {
        id: bonusPool._id,
        totalAmount: bonusPool.totalAmount,
        status: bonusPool.status
      };
    } else {
      console.log(`[ProjectListing] Created free project: ${project._id} (no bonus pool required)`);
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error in ListProject:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Test endpoint for debugging FormData
export const testFormData = async (req, res) => {
  try {
    console.log("Test FormData endpoint called");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request headers:", req.headers);
    
    res.status(200).json({
      message: "FormData test successful",
      body: req.body,
      files: req.files,
      headers: req.headers
    });
  } catch (error) {
    console.error("Test FormData error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

export default ListProject;

export const getProject = async (req, res) => {
  try {
    const { techStack, budget, contributor, search, category, page = 1, limit = 20 } = req.query;

    // If no query param is provided at all, fetch all projects
    if (!techStack && !budget && !contributor && !search && !category) {
      const allProjects = await ProjectListing.find();
      return res.status(200).json({
        message: "All projects fetched successfully",
        projects: allProjects,
        total: allProjects.length,
      });
    }

    const filter = {};   
    // search filter
    if (search && search !== "") {
      filter.project_Title = {
        $regex: search,
        $options: "i", // makes it case-insensitive
      };
    }
    //  techStack filter
    if (techStack && techStack !== "") {
      const techArray = techStack.split(",");
      filter.Project_tech_stack = {
        $regex: techArray.join("|"),
        $options: "i", // makes it case-insensitive
      };
    }

    // budget filter
    if (budget && budget !== "") {
      if (budget === "Free") {
        filter.project_starting_bid = 0;
      } else if (budget === "Micro_Budget") {
        filter.project_starting_bid = { $gt: 0, $lt: 500 };
      } else if (budget === "Low_Budget") {
        filter.project_starting_bid = { $gte: 500, $lt: 2000 };
      } else if (budget === "Medium_Budget") {
        filter.project_starting_bid = { $gte: 2000, $lt: 10000 };
      } else if (budget === "High_Budget") {
        filter.project_starting_bid = { $gte: 10000 };
      }
    }

    // contributor filter
    if (contributor && contributor !== "") {
      if (contributor === "Solo") {
        filter.Project_Contributor = 1;
      } else if (contributor === "Small_Team") {
        filter.Project_Contributor = { $gte: 2, $lte: 4 };
      } else if (contributor === "Medium_Team") {
        filter.Project_Contributor = { $gte: 5, $lte: 10 };
      } else if (contributor === "Large_Team") {
        filter.Project_Contributor = { $gt: 10 };
      }
    }

    // category filter
    if (category && category !== "") {
      filter.project_category = category;
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
      message: "Projects fetched successfully",
      projects,
      total,
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
