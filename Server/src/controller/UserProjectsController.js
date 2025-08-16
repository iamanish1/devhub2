import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import ProjectTask from "../Model/ProjectTaskModel.js";
import UserProfile from "../Model/UserProfileModel.js";

// Get user's assigned projects (where bid was accepted)
export const getUserAssignedProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all accepted bids by this user
    const acceptedBids = await Bidding.find({
      user_id: userId,
      bid_status: "Accepted"
    }).populate({
      path: "project_id",
      model: "ProjectListing",
      select: "project_Title project_starting_bid Project_Description Project_tech_stack Project_cover_photo project_duration user"
    });

    // Get project details with task progress
    const projectsWithProgress = await Promise.all(
      acceptedBids.map(async (bid) => {
        const project = bid.project_id;
        
        // Get all tasks for this project
        const tasks = await ProjectTask.find({ projectId: project._id });
        
                 // Calculate progress
         const totalTasks = tasks.length;
         const completedTasks = tasks.filter(task => 
           task.task_status === "Completed" || task.task_status === "done"
         ).length;
         const inProgressTasks = tasks.filter(task => 
           task.task_status === "In Progress" || 
           task.task_status === "in progress" ||
           task.task_status === "in-progress"
         ).length;
         const pendingTasks = tasks.filter(task => task.task_status === "todo").length;
        
                 // Debug logging
         console.log(`Project ${project._id}: Total: ${totalTasks}, Completed: ${completedTasks}, In Progress: ${inProgressTasks}, Pending: ${pendingTasks}`);
         
         // Determine project status using helper function
         const projectStatus = calculateProjectStatus(tasks);
         
         console.log(`📊 Final Project Status for ${project._id}: ${projectStatus}`);

        // Calculate progress percentage
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          _id: project._id,
          projectTitle: project.project_Title,
          projectDescription: project.Project_Description,
          techStack: project.Project_tech_stack,
          coverPhoto: project.Project_cover_photo,
          bidAmount: bid.bid_amount,
          projectDuration: project.project_duration,
          projectStatus,
          progressPercentage,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks: totalTasks - completedTasks - inProgressTasks,
          assignedDate: bid.created_at,
          bidId: bid._id
        };
      })
    );

    res.status(200).json({
      success: true,
      projects: projectsWithProgress
    });

  } catch (error) {
    console.error("Error fetching user assigned projects:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get user's project statistics
export const getUserProjectStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all accepted bids
    const acceptedBids = await Bidding.find({
      user_id: userId,
      bid_status: "Accepted"
    });

    // Get all projects for these bids
    const projectIds = acceptedBids.map(bid => bid.project_id);
    const projects = await ProjectListing.find({ _id: { $in: projectIds } });

    // Get all tasks for these projects
    const allTasks = await ProjectTask.find({ projectId: { $in: projectIds } });

    // Calculate statistics
    const totalProjects = acceptedBids.length;
    const totalEarnings = acceptedBids.reduce((sum, bid) => sum + bid.bid_amount, 0);
    
         // Project status breakdown using helper function
     const projectStats = await Promise.all(
       acceptedBids.map(async (bid) => {
         const tasks = allTasks.filter(task => task.projectId.toString() === bid.project_id.toString());
         return calculateProjectStatus(tasks);
       })
     );

    const completedProjects = projectStats.filter(status => status === "Completed").length;
    const inProgressProjects = projectStats.filter(status => status === "In Progress").length;
    const pendingProjects = projectStats.filter(status => status === "Pending").length;

         // Task statistics
     const totalTasks = allTasks.length;
     const completedTasks = allTasks.filter(task => 
       task.task_status === "Completed" || task.task_status === "done"
     ).length;
     const inProgressTasks = allTasks.filter(task => 
       task.task_status === "In Progress" || 
       task.task_status === "in progress" ||
       task.task_status === "in-progress"
     ).length;
     const pendingTasks = allTasks.filter(task => task.task_status === "todo").length;

    // Calculate completion rate
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Average project duration (if we have completion dates)
    const averageProjectDuration = totalProjects > 0 ? "Calculating..." : "N/A";

    const stats = {
      totalProjects,
      completedProjects,
      inProgressProjects,
      pendingProjects,
      totalEarnings,
      completionRate,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      taskCompletionRate,
      averageProjectDuration
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Error fetching user project stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get detailed project information with tasks
export const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify user has access to this project (bid was accepted)
    const bid = await Bidding.findOne({
      project_id: projectId,
      user_id: userId,
      bid_status: "Accepted"
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied"
      });
    }

    // Get project details
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Get all tasks for this project
    const tasks = await ProjectTask.find({ projectId }).sort({ createdAt: 1 });

         // Calculate progress
     const totalTasks = tasks.length;
     const completedTasks = tasks.filter(task => 
       task.task_status === "Completed" || task.task_status === "done"
     ).length;
     const inProgressTasks = tasks.filter(task => 
       task.task_status === "In Progress" || 
       task.task_status === "in progress" ||
       task.task_status === "in-progress"
     ).length;
     const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determine project status using helper function
    const projectStatus = calculateProjectStatus(tasks);

    const projectDetails = {
      _id: project._id,
      projectTitle: project.project_Title,
      projectDescription: project.Project_Description,
      techStack: project.Project_tech_stack,
      coverPhoto: project.Project_cover_photo,
      bidAmount: bid.bid_amount,
      projectDuration: project.project_duration,
      projectStatus,
      progressPercentage,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks: totalTasks - completedTasks - inProgressTasks,
      assignedDate: bid.created_at,
      tasks: tasks.map(task => ({
        _id: task._id,
        title: task.task_title,
        description: task.task_description,
        status: task.task_status,
        createdAt: task.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      project: projectDetails
    });

  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update task status (for user to mark tasks as completed)
// Helper function to calculate project status
const calculateProjectStatus = (tasks) => {
  const totalTasks = tasks.length;
  // More robust status checking with trim and case-insensitive comparison
  // Handle both "done" and "Completed" status values
  const completedTasks = tasks.filter(task => 
    task.task_status && (
      task.task_status.trim() === "Completed" || 
      task.task_status.trim() === "done"
    )
  ).length;
     const inProgressTasks = tasks.filter(task => 
     task.task_status && (
       task.task_status.trim() === "In Progress" ||
       task.task_status.trim() === "in progress" ||
       task.task_status.trim() === "in-progress"
     )
   ).length;
  
  // Debug logging
  console.log(`🔍 calculateProjectStatus Debug:`);
  console.log(`   Total tasks: ${totalTasks}`);
  console.log(`   Completed tasks: ${completedTasks}`);
  console.log(`   In Progress tasks: ${inProgressTasks}`);
  
  tasks.forEach((task, index) => {
    console.log(`   Task ${index + 1}: "${task.task_title}" - Status: "${task.task_status}"`);
  });
  
  if (totalTasks === 0) {
    console.log(`   Result: Pending (no tasks)`);
    return "Pending";
  }
  if (completedTasks === totalTasks && totalTasks > 0) {
    console.log(`   Result: Completed (${completedTasks}/${totalTasks} tasks completed)`);
    return "Completed";
  }
  if (completedTasks > 0 || inProgressTasks > 0) {
    console.log(`   Result: In Progress (${completedTasks} completed, ${inProgressTasks} in progress)`);
    return "In Progress";
  }
  console.log(`   Result: Pending (no active tasks)`);
  return "Pending";
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { task_status } = req.body;
    const userId = req.user._id;

    // Find the task
    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Verify user has access to this project
    const bid = await Bidding.findOne({
      project_id: task.projectId,
      user_id: userId,
      bid_status: "Accepted"
    });

    if (!bid) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this project"
      });
    }

    // Update task status
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { task_status },
      { new: true }
    );

    // Check if all tasks for this project are now completed
    const allProjectTasks = await ProjectTask.find({ projectId: task.projectId });
    const projectStatus = calculateProjectStatus(allProjectTasks);
    
    // Log for debugging
    console.log(`Project ${task.projectId}: Total tasks: ${allProjectTasks.length}, Status: ${projectStatus}`);
    
    // If all tasks are completed, log it
    if (projectStatus === "Completed") {
      console.log(`🎉 All tasks completed for project ${task.projectId}! Project marked as Completed.`);
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
      projectStatus: projectStatus
    });

  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Refresh project status for a specific project (for testing/debugging)
export const refreshProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify user has access to this project
    const bid = await Bidding.findOne({
      project_id: projectId,
      user_id: userId,
      bid_status: "Accepted"
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied"
      });
    }

    // Get all tasks for this project
    const tasks = await ProjectTask.find({ projectId });
    const projectStatus = calculateProjectStatus(tasks);
    
         const totalTasks = tasks.length;
     const completedTasks = tasks.filter(task => 
       task.task_status === "Completed" || task.task_status === "done"
     ).length;
     const inProgressTasks = tasks.filter(task => 
       task.task_status === "In Progress" || 
       task.task_status === "in progress" ||
       task.task_status === "in-progress"
     ).length;
     const pendingTasks = tasks.filter(task => task.task_status === "todo").length;

    console.log(`🔍 Project Status Refresh - Project ${projectId}:`);
    console.log(`   Total Tasks: ${totalTasks}`);
    console.log(`   Completed: ${completedTasks}`);
    console.log(`   In Progress: ${inProgressTasks}`);
    console.log(`   Pending: ${pendingTasks}`);
    console.log(`   Calculated Status: ${projectStatus}`);

    res.status(200).json({
      success: true,
      projectStatus,
      taskBreakdown: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks
      }
    });

  } catch (error) {
    console.error("Error refreshing project status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Test endpoint to create an "In Progress" task for testing
export const createTestInProgressTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify user has access to this project
    const bid = await Bidding.findOne({
      project_id: projectId,
      user_id: userId,
      bid_status: "Accepted"
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied"
      });
    }

    // Create a test "In Progress" task
    const testTask = new ProjectTask({
      task_title: "Test In Progress Task",
      task_description: "This is a test task to verify In Progress functionality",
      task_status: "In Progress",
      projectId: projectId
    });

    await testTask.save();

    console.log(`✅ Created test "In Progress" task for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Test In Progress task created successfully",
      task: testTask
    });

  } catch (error) {
    console.error("Error creating test In Progress task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Debug endpoint to check task data for a project
export const debugProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify user has access to this project
    const bid = await Bidding.findOne({
      project_id: projectId,
      user_id: userId,
      bid_status: "Accepted"
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied"
      });
    }

    // Get all tasks for this project
    const tasks = await ProjectTask.find({ projectId });
    
    // Log all task data for debugging
    console.log(`🔍 Debug Project Tasks - Project ${projectId}:`);
    console.log(`Total tasks found: ${tasks.length}`);
    
    tasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log(`  ID: ${task._id}`);
      console.log(`  Title: ${task.task_title}`);
      console.log(`  Status: "${task.task_status}" (length: ${task.task_status ? task.task_status.length : 0})`);
      console.log(`  Status trimmed: "${task.task_status ? task.task_status.trim() : ''}"`);
      console.log(`  Created: ${task.createdAt}`);
    });

    // Group tasks by status
    const statusGroups = tasks.reduce((acc, task) => {
      const status = task.task_status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {});

    console.log(`Task Status Breakdown:`);
    Object.keys(statusGroups).forEach(status => {
      console.log(`  "${status}": ${statusGroups[status].length} tasks`);
    });

    res.status(200).json({
      success: true,
      projectId,
      totalTasks: tasks.length,
      tasks: tasks.map(task => ({
        _id: task._id,
        title: task.task_title,
        status: task.task_status,
        createdAt: task.createdAt
      })),
      statusBreakdown: statusGroups
    });

  } catch (error) {
    console.error("Error debugging project tasks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
