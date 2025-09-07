/**
 * Backend Project Status Utility Functions
 * Handles project status calculation based on duration and contributor selection
 */

import ProjectTask from '../Model/ProjectTaskModel.js';

/**
 * Calculate project status based on duration and contributor selection
 * @param {Object} project - Project object
 * @returns {Object} - Status object with status, message, and styling info
 */
export const calculateProjectStatus = async (project) => {
  if (!project) {
    return {
      status: 'unknown',
      message: 'Status Unknown',
      color: 'gray',
      bgColor: 'gray-500/20',
      borderColor: 'gray-500/30',
      icon: '❓'
    };
  }

  const currentDate = new Date();
  const projectEndDate = new Date(project.project_duration);
  const isProjectExpired = currentDate > projectEndDate;
  
  // Check if contributors are selected and working
  const hasSelectedContributors = project.selectedContributors && 
    project.selectedContributors.length > 0;
  
  const hasActiveContributors = hasSelectedContributors && 
    project.selectedContributors.some(contributor => 
      contributor.status === 'pending' || contributor.status === 'paid'
    );

  // Check if there are active tasks (if project has tasks)
  let hasActiveTasks = false;
  if (project._id) {
    try {
      const tasks = await ProjectTask.find({ projectId: project._id });
      hasActiveTasks = tasks.some(task => 
        task.status === 'in_progress' || task.status === 'pending'
      );
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      hasActiveTasks = false;
    }
  }

  // Status Logic
  if (isProjectExpired) {
    return {
      status: 'closed',
      message: 'Project Closed',
      color: 'red',
      bgColor: 'red-500/20',
      borderColor: 'red-500/30',
      icon: '🔒',
      description: 'Project duration has ended'
    };
  }

  if (hasActiveContributors && (hasActiveTasks || hasSelectedContributors)) {
    return {
      status: 'team_working',
      message: 'Team Working on Project',
      color: 'blue',
      bgColor: 'blue-500/20',
      borderColor: 'blue-500/30',
      icon: '👥',
      description: 'Contributors are actively working'
    };
  }

  if (hasSelectedContributors) {
    return {
      status: 'contributors_selected',
      message: 'Contributors Selected',
      color: 'yellow',
      bgColor: 'yellow-500/20',
      borderColor: 'yellow-500/30',
      icon: '✅',
      description: 'Contributors have been selected'
    };
  }

  // Default status for active projects
  return {
    status: 'active',
    message: 'Active Project',
    color: 'green',
    bgColor: 'green-500/20',
    borderColor: 'green-500/30',
    icon: '🚀',
    description: 'Open for bidding'
  };
};

/**
 * Calculate project status for multiple projects
 * @param {Array} projects - Array of project objects
 * @returns {Array} - Array of projects with status information
 */
export const calculateProjectsStatus = async (projects) => {
  if (!projects || !Array.isArray(projects)) {
    return [];
  }

  const projectsWithStatus = await Promise.all(
    projects.map(async (project) => {
      const statusInfo = await calculateProjectStatus(project);
      return {
        ...project.toObject ? project.toObject() : project,
        statusInfo
      };
    })
  );

  return projectsWithStatus;
};

/**
 * Check if project is accepting new bids
 * @param {Object} project - Project object
 * @returns {Boolean} - Whether project accepts new bids
 */
export const isProjectAcceptingBids = (project) => {
  if (!project) return false;
  
  const currentDate = new Date();
  const projectEndDate = new Date(project.project_duration);
  const isProjectExpired = currentDate > projectEndDate;
  
  if (isProjectExpired) return false;
  
  const hasSelectedContributors = project.selectedContributors && 
    project.selectedContributors.length > 0;
  
  // Project accepts bids if it's not expired and either has no selected contributors
  // or has selected contributors but they're not all paid (still accepting more)
  return !hasSelectedContributors || 
    project.selectedContributors.some(contributor => contributor.status === 'pending');
};
