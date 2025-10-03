import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import ProjectTask from "../Model/ProjectTaskModel.js";
import UserProfile from "../Model/UserProfileModel.js";
import { firestoreDb } from "../config/firebaseAdmin.js";


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
        
        // Get all tasks for this project with completion dates
        const tasks = await ProjectTask.find({ projectId: project._id }).select('title status completedAt createdAt');
        
        // Debug logging
        console.log(`🔍 [getUserAssignedProjects] Project ${project._id}: Found ${tasks.length} tasks`);
        
                 // Calculate progress
         const totalTasks = tasks.length;
         const completedTasks = tasks.filter(task => 
           task.status === "completed" || task.status === "Completed" || task.status === "done"
         ).length;
         const inProgressTasks = tasks.filter(task => 
           task.status === "in_progress" || 
           task.status === "In Progress" || 
           task.status === "in progress" ||
           task.status === "in-progress"
         ).length;
         const pendingTasks = tasks.filter(task => 
           task.status === "pending" || task.status === "todo" || task.status === "Pending"
         ).length;
        
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
          bidId: bid._id,
          tasks: tasks.map(task => ({
            _id: task._id,
            title: task.title,
            status: task.status,
            completedAt: task.completedAt,
            createdAt: task.createdAt
          }))
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
       task.status === "completed" || task.status === "Completed" || task.status === "done"
     ).length;
     const inProgressTasks = allTasks.filter(task => 
       task.status === "in_progress" || 
       task.status === "In Progress" || 
       task.status === "in progress" ||
       task.status === "in-progress"
     ).length;
     const pendingTasks = allTasks.filter(task => 
       task.status === "pending" || task.status === "todo" || task.status === "Pending"
     ).length;

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
       task.status === "completed" || task.status === "Completed" || task.status === "done"
     ).length;
     const inProgressTasks = tasks.filter(task => 
       task.status === "in_progress" || 
       task.status === "In Progress" || 
       task.status === "in progress" ||
       task.status === "in-progress"
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
        title: task.title,
        description: task.description,
        status: task.status,
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
// Helper function to update user profile statistics
const updateUserProfileStats = async (userId, oldStatus, newStatus, projectStatus, updatedTask = null) => {
  try {
    console.log(`🔄 Updating profile stats for user ${userId}: ${oldStatus} -> ${newStatus}, Project: ${projectStatus}`);
    
    // Find or create user profile
    let userProfile = await UserProfile.findOne({ username: userId });
    
    if (!userProfile) {
      console.log(`📝 Creating new profile for user ${userId}`);
      userProfile = new UserProfile({
        username: userId,
        user_project_contribution: 0,
        user_completed_projects: 0,
      });
    }

    // Check if task was just completed (increment contribution)
    const wasCompleted = oldStatus && (
      oldStatus.trim() === "completed" || 
      oldStatus.trim() === "Completed" || 
      oldStatus.trim() === "done"
    );
    
    const isNowCompleted = newStatus && (
      newStatus.trim() === "completed" || 
      newStatus.trim() === "Completed" || 
      newStatus.trim() === "done"
    );

    // If task just became completed, increment contribution
    if (!wasCompleted && isNowCompleted) {
      userProfile.user_project_contribution = (userProfile.user_project_contribution || 0) + 1;
      console.log(`✅ Incremented contribution count for user ${userId}. New count: ${userProfile.user_project_contribution}`);
    }

    // Recalculate completed projects based on actual project completion status
    // This ensures accuracy instead of relying on incremental updates
    const acceptedBids = await Bidding.find({
      user_id: userId,
      bid_status: "Accepted"
    });
    
    let completedProjectsCount = 0;
    
    // Check each project to see if it's actually completed
    for (const bid of acceptedBids) {
      const projectTasks = await ProjectTask.find({ projectId: bid.project_id });
      const projectTaskStatus = calculateProjectStatus(projectTasks);
      
      if (projectTaskStatus === "Completed") {
        completedProjectsCount++;
      }
    }
    
    userProfile.user_completed_projects = completedProjectsCount;
    console.log(`🎉 Updated completed projects count for user ${userId}. New count: ${userProfile.user_completed_projects}`);

    // Save the updated profile
    await userProfile.save();
    console.log(`💾 Profile stats updated for user ${userId}: Contributions: ${userProfile.user_project_contribution}, Completed Projects: ${userProfile.user_completed_projects}`);
    
    // Automatically sync updated contribution count to Firebase for real-time updates
    if (firestoreDb && (!wasCompleted && isNowCompleted)) {
      try {
        // Sync only the newly completed task to Firebase (incremental update)
        if (updatedTask) {
          await syncSingleTaskCompletionToFirebase(userId, userProfile, updatedTask);
        } else {
          // Fallback to full sync if updatedTask is not available
          await syncAllContributionsToFirebase(userId, userProfile, []);
        }
        console.log(`🔥 [Firebase] Auto-synced single task completion to Firebase for user ${userId} (total: ${userProfile.user_project_contribution})`);
        
      } catch (firebaseError) {
        console.error("Firebase contribution sync error:", firebaseError);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error updating profile stats for user ${userId}:`, error);
    // Don't throw error to avoid breaking the main task update flow
  }
};

// Helper function to calculate project status
const calculateProjectStatus = (tasks) => {
  const totalTasks = tasks.length;
  // More robust status checking with trim and case-insensitive comparison
  // Handle both "done" and "Completed" status values
  const completedTasks = tasks.filter(task => 
    task.status && (
      task.status.trim() === "completed" || 
      task.status.trim() === "Completed" || 
      task.status.trim() === "done"
    )
  ).length;
     const inProgressTasks = tasks.filter(task => 
     task.status && (
       task.status.trim() === "in_progress" ||
       task.status.trim() === "In Progress" ||
       task.status.trim() === "in progress" ||
       task.status.trim() === "in-progress"
     )
   ).length;
  
  // Debug logging
  console.log(`🔍 calculateProjectStatus Debug:`);
  console.log(`   Total tasks: ${totalTasks}`);
  console.log(`   Completed tasks: ${completedTasks}`);
  console.log(`   In Progress tasks: ${inProgressTasks}`);
  
  tasks.forEach((task, index) => {
    console.log(`   Task ${index + 1}: "${task.title}" - Status: "${task.status}"`);
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

    // Get the old task status for comparison
    const oldStatus = task.status;

    // Update task status and set completion date if task is being completed
    const updateData = { status: task_status };
    
    // Set completedAt timestamp if task is being marked as completed
    if (task_status && (
      task_status.trim() === "completed" || 
      task_status.trim() === "Completed" || 
      task_status.trim() === "done"
    )) {
      updateData.completedAt = new Date();
    }
    
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );

    // Sync task completion to Firebase for real-time updates
    if (firestoreDb && task_status && (
      task_status.trim() === "completed" || 
      task_status.trim() === "Completed" || 
      task_status.trim() === "done"
    )) {
      try {
        // Sync task data to Firebase immediately
        await firestoreDb.collection('project_tasks').doc(taskId).set({
          _id: taskId,
          title: updatedTask.title,
          status: updatedTask.status,
          completedAt: updatedTask.completedAt,
          projectId: updatedTask.projectId,
          assignedTo: updatedTask.assignedTo,
          updatedAt: new Date(),
          syncedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log(`🔥 [Firebase] Synced task completion to Firebase: ${taskId}`);
        
        // Also trigger a real-time event for immediate frontend updates
        await firestoreDb.collection('realtime_events').add({
          type: 'task_completed',
          taskId: taskId,
          userId: userId,
          projectId: updatedTask.projectId,
          timestamp: new Date(),
          data: {
            title: updatedTask.title,
            status: updatedTask.status,
            completedAt: updatedTask.completedAt
          }
        });
        
        console.log(`🔥 [Firebase] Created real-time event for task completion: ${taskId}`);
      } catch (firebaseError) {
        console.error("Firebase sync error:", firebaseError);
      }
    }

    // Check if all tasks for this project are now completed
    const allProjectTasks = await ProjectTask.find({ projectId: task.projectId });
    const projectStatus = calculateProjectStatus(allProjectTasks);
    
    // Log for debugging
    console.log(`Project ${task.projectId}: Total tasks: ${allProjectTasks.length}, Status: ${projectStatus}`);
    
    // Update user profile statistics
    await updateUserProfileStats(userId, oldStatus, task_status, projectStatus, updatedTask);
    
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
       task.status === "completed" || task.status === "Completed" || task.status === "done"
     ).length;
     const inProgressTasks = tasks.filter(task => 
       task.status === "in_progress" || 
       task.status === "In Progress" || 
       task.status === "in progress" ||
       task.status === "in-progress"
     ).length;
     const pendingTasks = tasks.filter(task => 
       task.status === "pending" || task.status === "todo" || task.status === "Pending"
     ).length;

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

// Function to recalculate and update user profile statistics
export const recalculateUserProfileStats = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`🔄 Recalculating profile stats for user ${userId}`);

    // Get all accepted bids for this user
    const acceptedBids = await Bidding.find({
      user_id: userId,
      bid_status: "Accepted"
    });

    // Get all project IDs
    const projectIds = acceptedBids.map(bid => bid.project_id);

    // Get all tasks for these projects
    const allTasks = await ProjectTask.find({ projectId: { $in: projectIds } });

    // Calculate actual statistics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => 
      task.status === "completed" || task.status === "Completed" || task.status === "done"
    ).length;

    // Calculate completed projects
    const projectStats = await Promise.all(
      acceptedBids.map(async (bid) => {
        const tasks = allTasks.filter(task => task.projectId.toString() === bid.project_id.toString());
        return calculateProjectStatus(tasks);
      })
    );

    const completedProjects = projectStats.filter(status => status === "Completed").length;

    // Find or create user profile
    let userProfile = await UserProfile.findOne({ username: userId });
    
    if (!userProfile) {
      console.log(`📝 Creating new profile for user ${userId}`);
      userProfile = new UserProfile({
        username: userId,
        user_project_contribution: 0,
        user_completed_projects: 0,
      });
    }

    // Update with calculated values
    const oldContribution = userProfile.user_project_contribution;
    const oldCompleted = userProfile.user_completed_projects;
    
    userProfile.user_project_contribution = completedTasks;
    userProfile.user_completed_projects = completedProjects;

    await userProfile.save();

    // Sync the recalculated data to Firebase
    await syncAllContributionsToFirebase(userId, userProfile, allTasks);

    console.log(`✅ Profile stats recalculated for user ${userId}:`);
    console.log(`   Contributions: ${oldContribution} -> ${completedTasks}`);
    console.log(`   Completed Projects: ${oldCompleted} -> ${completedProjects}`);

    res.status(200).json({
      success: true,
      message: "Profile statistics recalculated and synced successfully",
      stats: {
        totalProjects: acceptedBids.length,
        totalTasks,
        completedTasks,
        completedProjects,
        oldContribution,
        oldCompleted,
        newContribution: completedTasks,
        newCompleted: completedProjects
      }
    });

  } catch (error) {
    console.error("Error recalculating profile stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Helper function to sync a single task completion to Firebase (incremental)
export const syncSingleTaskCompletionToFirebase = async (userId, userProfile, completedTask) => {
  if (!firestoreDb) {
    console.error("❌ [Firebase] Firestore database not initialized");
    return;
  }
  
  try {
    console.log(`🔥 [Firebase] Syncing single task completion for user ${userId}: ${completedTask.title}`);
    
    // Get existing Firebase data
    const userContributionsRef = firestoreDb.collection('userContributions').doc(userId);
    const existingDoc = await userContributionsRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    
    console.log(`📄 [Firebase] Existing Firebase data:`, existingData);
    
    // Get the completion date for this specific task
    const completionDate = completedTask.completedAt ? new Date(completedTask.completedAt) : new Date(completedTask.createdAt);
    const dateKey = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}-${String(completionDate.getDate()).padStart(2, '0')}`;
    
    console.log(`📅 [Firebase] Task completed on ${dateKey}: ${completedTask.title}`);
    
    // Start with existing data to preserve all historical contributions
    const contributionData = { ...existingData };
    
    // Increment the count for this specific date (accumulate)
    const existingCount = contributionData[dateKey] || 0;
    contributionData[dateKey] = existingCount + 1;
    
    console.log(`📅 [Firebase] Incrementing ${dateKey}: ${existingCount} + 1 = ${contributionData[dateKey]} contributions`);
    
    // Update metadata
    contributionData.lastUpdated = new Date();
    contributionData.totalContributions = userProfile.user_project_contribution;
    contributionData.profileContributions = userProfile.user_project_contribution;
    contributionData.syncedAt = new Date().toISOString();
    
    console.log(`💾 [Firebase] About to save incremental contribution data:`, contributionData);
    
    // Update Firebase with incremental contribution data (merge to preserve existing dates)
    await userContributionsRef.set(contributionData, { merge: true });
    
    console.log(`🔥 [Firebase] Successfully synced single task completion to Firebase for user ${userId}`);
    console.log(`📊 [Firebase] Total dates with contributions: ${Object.keys(contributionData).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/)).length}`);
    
  } catch (firebaseError) {
    console.error("❌ [Firebase] Single task sync error:", firebaseError);
    console.error("❌ [Firebase] Error details:", {
      message: firebaseError.message,
      code: firebaseError.code,
      stack: firebaseError.stack
    });
  }
};

// Helper function to sync all contributions to Firebase
export const syncAllContributionsToFirebase = async (userId, userProfile, allTasks = []) => {
  if (!firestoreDb) {
    console.error("❌ [Firebase] Firestore database not initialized");
    return;
  }
  
  try {
    console.log(`🔥 [Firebase] Syncing all contributions for user ${userId}`);
    console.log(`📊 [Firebase] User profile contributions: ${userProfile.user_project_contribution}`);
    
    // Get existing Firebase data first to preserve existing contributions
    const userContributionsRef = firestoreDb.collection('userContributions').doc(userId);
    const existingDoc = await userContributionsRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    
    console.log(`📄 [Firebase] Existing Firebase data:`, existingData);
    
    // Build contribution map from actual task completion dates
    const contributionMap = new Map();
    
    // If allTasks is provided, use it; otherwise fetch all tasks for this user
    let tasksToProcess = allTasks;
    if (tasksToProcess.length === 0) {
      // Fetch all accepted bids for this user
      const acceptedBids = await Bidding.find({
        user_id: userId,
        bid_status: "Accepted"
      });
      
      console.log(`🎯 [Firebase] Found ${acceptedBids.length} accepted bids for user ${userId}`);
      
      // Get all project IDs
      const projectIds = acceptedBids.map(bid => bid.project_id);
      
      // Get all tasks for these projects
      tasksToProcess = await ProjectTask.find({ projectId: { $in: projectIds } });
    }
    
    console.log(`📊 [Firebase] Processing ${tasksToProcess.length} tasks for user ${userId}`);
    
    // Count completed tasks by date
    let completedTasksCount = 0;
    tasksToProcess.forEach(task => {
      if (task.status === "completed" || task.status === "Completed" || task.status === "done") {
        completedTasksCount++;
        const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
        const dateKey = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}-${String(completionDate.getDate()).padStart(2, '0')}`;
        
        const existingCount = contributionMap.get(dateKey) || 0;
        contributionMap.set(dateKey, existingCount + 1);
        
        console.log(`✅ [Firebase] Task completed on ${dateKey}: ${task.title}`);
      }
    });
    
    console.log(`📊 [Firebase] Found ${completedTasksCount} completed tasks`);
    
    // Start with existing Firebase data to preserve all historical contributions
    const contributionData = { ...existingData };
    
    // Only update dates that have new contributions (accumulate, don't overwrite)
    contributionMap.forEach((count, dateKey) => {
      // If this date already exists in Firebase, add to it (accumulate)
      // If it doesn't exist, set it to the new count
      const existingCount = contributionData[dateKey] || 0;
      contributionData[dateKey] = existingCount + count;
      console.log(`📅 [Firebase] Accumulating ${dateKey}: ${existingCount} + ${count} = ${contributionData[dateKey]} contributions`);
    });
    
    // Add/update metadata
    contributionData.lastUpdated = new Date();
    contributionData.totalContributions = userProfile.user_project_contribution;
    contributionData.profileContributions = userProfile.user_project_contribution;
    contributionData.syncedAt = new Date().toISOString();
    
    console.log(`💾 [Firebase] About to save contribution data:`, contributionData);
    
    // Update Firebase with all contribution data (merge to preserve existing dates)
    await userContributionsRef.set(contributionData, { merge: true });
    
    console.log(`🔥 [Firebase] Successfully synced all contributions to Firebase for user ${userId}`);
    console.log(`📊 [Firebase] Total dates with contributions: ${Object.keys(contributionData).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/)).length}`);
    
  } catch (firebaseError) {
    console.error("❌ [Firebase] Sync error:", firebaseError);
    console.error("❌ [Firebase] Error details:", {
      message: firebaseError.message,
      code: firebaseError.code,
      stack: firebaseError.stack
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
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: "${task.status}" (length: ${task.status ? task.status.length : 0})`);
      console.log(`  Status trimmed: "${task.status ? task.status.trim() : ''}"`);
      console.log(`  Created: ${task.createdAt}`);
    });

    // Group tasks by status
    const statusGroups = tasks.reduce((acc, task) => {
      const status = task.status;
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
        title: task.title,
        status: task.status,
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

// Manual sync endpoint to force sync all contributions to Firebase
export const manualSyncContributions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`🔄 [Manual Sync] Starting manual sync for user ${userId}`);
    
    // Get user profile
    const userProfile = await UserProfile.findOne({ username: userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }
    
    // Force sync all contributions to Firebase
    await syncAllContributionsToFirebase(userId, userProfile, []);
    
    console.log(`✅ [Manual Sync] Completed manual sync for user ${userId}`);
    
    res.json({
      success: true,
      message: "Contributions synced successfully",
      userId,
      totalContributions: userProfile.user_project_contribution
    });

  } catch (error) {
    console.error("Manual sync error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Debug endpoint to check user's contribution data
export const debugUserContributions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`🔍 Debug User Contributions - User ${userId}:`);
    
    // Get user profile
    const userProfile = await UserProfile.findOne({ username: userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }
    
    // Get all accepted bids for this user
    const acceptedBids = await Bidding.find({
      user_id: userId,
      bid_status: "Accepted"
    });
    
    // Get all project IDs
    const projectIds = acceptedBids.map(bid => bid.project_id);
    
    // Get all tasks for these projects
    const allTasks = await ProjectTask.find({ projectId: { $in: projectIds } });
    
    // Count completed tasks by date
    const contributionMap = new Map();
    allTasks.forEach(task => {
      if (task.status === "completed" || task.status === "Completed" || task.status === "done") {
        const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
        const dateKey = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}-${String(completionDate.getDate()).padStart(2, '0')}`;
        
        const existingCount = contributionMap.get(dateKey) || 0;
        contributionMap.set(dateKey, existingCount + 1);
      }
    });
    
    // Convert map to object
    const contributionData = {};
    contributionMap.forEach((count, dateKey) => {
      contributionData[dateKey] = count;
    });
    
    console.log(`📊 User Profile Stats:`);
    console.log(`  Total Contributions: ${userProfile.user_project_contribution}`);
    console.log(`  Completed Projects: ${userProfile.user_completed_projects}`);
    
    console.log(`📅 Contribution Data by Date:`);
    Object.entries(contributionData).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} contributions`);
    });
    
    // Get Firebase data if available
    let firebaseData = null;
    if (firestoreDb) {
      try {
        const userContributionsRef = firestoreDb.collection('userContributions').doc(userId);
        const firebaseDoc = await userContributionsRef.get();
        if (firebaseDoc.exists) {
          firebaseData = firebaseDoc.data();
          console.log(`🔥 Firebase Data:`, firebaseData);
        } else {
          console.log(`🔥 No Firebase data found`);
        }
      } catch (firebaseError) {
        console.error("Firebase error:", firebaseError);
      }
    }
    
    res.json({
      success: true,
      userId,
      userProfile: {
        totalContributions: userProfile.user_project_contribution,
        completedProjects: userProfile.user_completed_projects
      },
      contributionData,
      firebaseData,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(task => 
        task.status === "completed" || task.status === "Completed" || task.status === "done"
      ).length
    });

  } catch (error) {
    console.error("Debug user contributions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
