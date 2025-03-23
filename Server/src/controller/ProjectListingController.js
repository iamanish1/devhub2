const ProjectListing = async (req, res) => {
  try {
    const {
      project_Title,
      Project_Bid_Amount,
      Project_Contributor,
      Project_Number_Of_Bids,
      Project_Description ,
      Project_Domain,
      Project_Features,
      Project_looking,
      Project_Duration, 
      Project_gitHub_link,
      Project_cover_photo ,
    } = req.body;
    // Validate required fields
    if (
     !project_Title ||
     !Project_Bid_Amount ||
     !Project_contributor ||
     !Project_Number_Of_Bids ||
     !Project_Description ||
     !Project_Domain ||
     !Project_Features ||
     !Project_looking ||
     !Project_Duration ||
     !Project_gitHub_link ||
     !Project_cover_photo
    ) { 
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    // Create new project listing
    const project = new ProjectListing({
      project_Title,
      Project_Bid_Amount,
      Project_contributor,
      Project_Number_Of_Bids,
      Project_Description,
      Project_Domain,
      Project_Features,
      Project_looking,
      Project_Duration,
      Project_gitHub_link,
      Project_cover_photo,
      owner: req.user.id,
    });
    await project.save();
    res.status(201).json({
      message: "Project listing created successfully",
      project,
    });
  } catch (error) {
    res.status(404).json({
      message: error.message,
      error: error,
      user : project , 
    });
  }
};

export default ProjectListing; 
