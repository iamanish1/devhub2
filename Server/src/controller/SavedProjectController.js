import SavedProject from "../Model/SavedProjectModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";

// Save a project
export const saveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Security check: Ensure user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if project exists
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if already saved
    const existingSave = await SavedProject.findOne({
      user: userId,
      project: projectId,
    });

    if (existingSave) {
      return res.status(400).json({ message: "Project already saved" });
    }

    // Save the project
    const savedProject = new SavedProject({
      user: userId,
      project: projectId,
    });

    await savedProject.save();

    console.log(`💾 User ${userId} saved project ${projectId}`);

    res.status(201).json({
      message: "Project saved successfully",
      savedProject,
    });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Unsave a project
export const unsaveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const deletedSave = await SavedProject.findOneAndDelete({
      user: userId,
      project: projectId,
    });

    if (!deletedSave) {
      return res.status(404).json({ message: "Saved project not found" });
    }

    res.json({ message: "Project unsaved successfully" });
  } catch (error) {
    console.error("Error unsaving project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's saved projects
export const getSavedProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Additional security: Ensure we're only getting projects for the authenticated user
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const savedProjects = await SavedProject.find({ user: userId })
      .populate({
        path: "project",
        select: "project_Title Project_Description Project_cover_photo project_starting_bid Project_Bid_Amount Project_Number_Of_Bids Project_Contributor Project_tech_stack project_duration user",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({ savedAt: -1 });

    console.log(`📚 Fetched ${savedProjects.length} saved projects for user: ${userId}`);

    res.json({
      savedProjects: savedProjects.map((sp) => ({
        _id: sp._id,
        savedAt: sp.savedAt,
        project: sp.project,
      })),
      totalCount: savedProjects.length,
      userId: userId, // For debugging - remove in production
    });
  } catch (error) {
    console.error("Error getting saved projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if project is saved by user
export const checkIfSaved = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const savedProject = await SavedProject.findOne({
      user: userId,
      project: projectId,
    });

    res.json({
      isSaved: !!savedProject,
      savedProject: savedProject || null,
    });
  } catch (error) {
    console.error("Error checking saved status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
