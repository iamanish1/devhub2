import Bidding from '../Model/BiddingModel.js';
import UserProfile from '../Model/UserProfileModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectSelection from '../Model/ProjectSelectionModel.js';
import { logger } from '../utils/logger.js';

class SelectionAlgorithm {
  constructor() {
    this.logger = logger;
  }

  /**
   * Main selection algorithm that scores and ranks bidders
   * @param {string} projectId - Project ID
   * @param {Object} selectionConfig - Selection configuration
   * @returns {Array} - Ranked list of bidders with scores
   */
  async selectBidders(projectId, selectionConfig) {
    try {
      this.logger.info(`[SelectionAlgorithm] Starting selection for project: ${projectId}`);
      
      // Get project details
      const project = await ProjectListing.findById(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Get all bids for the project
      const bids = await Bidding.find({ 
        project_id: projectId,
        bid_status: 'Pending'
      }).populate('user_id', 'username email usertype');

      this.logger.info(`[SelectionAlgorithm] Found ${bids.length} bids for project: ${projectId}`);

      if (bids.length === 0) {
        return [];
      }

      // Get user profiles for all bidders
      const userIds = bids.map(bid => bid.user_id._id);
      const userProfiles = await UserProfile.find({ 
        username: { $in: userIds } 
      });

      // Create a map for quick profile lookup
      const profileMap = new Map();
      userProfiles.forEach(profile => {
        profileMap.set(profile.username.toString(), profile);
      });

      // Score each bidder
      const scoredBidders = await Promise.all(
        bids.map(async (bid) => {
          const userProfile = profileMap.get(bid.user_id._id.toString());
          return await this.scoreBidder(bid, userProfile, project, selectionConfig);
        })
      );

      // Filter out bidders with disqualifying criteria
      const qualifiedBidders = scoredBidders.filter(bidder => 
        bidder.disqualified === false
      );

      // Sort by total score (descending)
      qualifiedBidders.sort((a, b) => b.totalScore - a.totalScore);

      // Limit to max bids to consider
      const limitedBidders = qualifiedBidders.slice(0, selectionConfig.maxBidsToConsider);

      this.logger.info(`[SelectionAlgorithm] Selection completed. Qualified: ${qualifiedBidders.length}, Limited: ${limitedBidders.length}`);

      return limitedBidders;

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error in selectBidders: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Score an individual bidder based on multiple criteria
   * @param {Object} bid - Bid object
   * @param {Object} userProfile - User profile object
   * @param {Object} project - Project object
   * @param {Object} selectionConfig - Selection configuration
   * @returns {Object} - Scored bidder object
   */
  async scoreBidder(bid, userProfile, project, selectionConfig) {
    try {
      const scores = {
        skillMatch: 0,
        bidAmount: 0,
        experience: 0,
        availability: 0,
        totalScore: 0
      };

      const details = {
        disqualified: false,
        disqualificationReason: null,
        skillMatchDetails: [],
        experienceDetails: {},
        availabilityDetails: {}
      };

      // 1. Skill Matching Score (40% weight)
      scores.skillMatch = await this.calculateSkillMatchScore(
        bid.skills, 
        userProfile, 
        selectionConfig.requiredSkills,
        details
      );

      // 2. Bid Amount Score (30% weight)
      scores.bidAmount = this.calculateBidAmountScore(
        bid.bid_amount, 
        project.project_starting_bid,
        details
      );

      // 3. Experience Score (20% weight)
      scores.experience = this.calculateExperienceScore(
        bid.year_of_experience,
        userProfile,
        details
      );

      // 4. Availability Score (10% weight)
      scores.availability = this.calculateAvailabilityScore(
        bid.hours_avilable_per_week,
        details
      );

      // Calculate weighted total score
      const weights = selectionConfig.criteriaWeights;
      scores.totalScore = (
        (scores.skillMatch * weights.skillMatch) +
        (scores.bidAmount * weights.bidAmount) +
        (scores.experience * weights.experience) +
        (scores.availability * weights.availability)
      ) / 100;

      return {
        bidId: bid._id,
        userId: bid.user_id._id,
        username: bid.user_id.username,
        email: bid.user_id.email,
        usertype: bid.user_id.usertype,
        bidAmount: bid.bid_amount,
        yearOfExperience: bid.year_of_experience,
        hoursAvailable: bid.hours_avilable_per_week,
        skills: bid.skills,
        bidDescription: bid.bid_description,
        scores,
        details,
        userProfile: userProfile ? {
          bio: userProfile.user_profile_bio,
          completedProjects: userProfile.user_completed_projects,
          contributions: userProfile.user_project_contribution,
          skills: userProfile.user_profile_skills
        } : null
      };

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error scoring bidder: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Calculate skill matching score
   * @param {Array} bidSkills - Skills from bid
   * @param {Object} userProfile - User profile
   * @param {Array} requiredSkills - Required skills for project
   * @param {Object} details - Details object to populate
   * @returns {number} - Skill match score (0-100)
   */
  async calculateSkillMatchScore(bidSkills, userProfile, requiredSkills, details) {
    try {
      if (!requiredSkills || requiredSkills.length === 0) {
        return 50; // Default score if no skills specified
      }

      let totalScore = 0;
      let maxPossibleScore = 0;
      const skillMatchDetails = [];

      for (const requiredSkill of requiredSkills) {
        const skillName = requiredSkill.name.toLowerCase();
        const skillWeight = requiredSkill.weight;
        const isRequired = requiredSkill.required;

        maxPossibleScore += skillWeight;

        // Check if skill exists in bid skills
        const hasSkillInBid = bidSkills.some(skill => 
          skill.toLowerCase().includes(skillName) || 
          skillName.includes(skill.toLowerCase())
        );

        // Check if skill exists in user profile
        let hasSkillInProfile = false;
        let profileSkillLevel = 0;

        if (userProfile && userProfile.user_profile_skills) {
          const profileSkill = userProfile.user_profile_skills.find(skill => 
            skill.name.toLowerCase().includes(skillName) || 
            skillName.includes(skill.name.toLowerCase())
          );

          if (profileSkill) {
            hasSkillInProfile = true;
            profileSkillLevel = this.convertProficiencyToNumber(profileSkill.proficiency);
          }
        }

        // Calculate skill score
        let skillScore = 0;
        if (hasSkillInBid || hasSkillInProfile) {
          skillScore = skillWeight;
          
          // Bonus for profile skill level
          if (hasSkillInProfile) {
            skillScore += (profileSkillLevel * skillWeight * 0.2); // 20% bonus for profile skills
          }
        } else if (isRequired) {
          // Disqualify if required skill is missing
          details.disqualified = true;
          details.disqualificationReason = `Missing required skill: ${requiredSkill.name}`;
          return 0;
        }

        totalScore += skillScore;

        skillMatchDetails.push({
          skill: requiredSkill.name,
          required: isRequired,
          weight: skillWeight,
          hasInBid: hasSkillInBid,
          hasInProfile: hasSkillInProfile,
          profileLevel: profileSkillLevel,
          score: skillScore
        });
      }

      details.skillMatchDetails = skillMatchDetails;

      // Normalize to 0-100 scale
      const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      return Math.min(100, Math.max(0, normalizedScore));

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error in calculateSkillMatchScore: ${error.message}`, error);
      return 0;
    }
  }

  /**
   * Calculate bid amount score (higher bids get preference)
   * @param {number} bidAmount - User's bid amount
   * @param {number} startingBid - Project starting bid
   * @param {Object} details - Details object
   * @returns {number} - Bid amount score (0-100)
   */
  calculateBidAmountScore(bidAmount, startingBid, details) {
    try {
      if (bidAmount <= 0 || startingBid <= 0) {
        return 0;
      }

      // Calculate bid ratio (how much higher than starting bid)
      const bidRatio = bidAmount / startingBid;
      
      // Score based on bid ratio
      let score = 0;
      if (bidRatio >= 2.0) {
        score = 100; // 2x or higher gets full score
      } else if (bidRatio >= 1.5) {
        score = 80; // 1.5x gets 80%
      } else if (bidRatio >= 1.2) {
        score = 60; // 1.2x gets 60%
      } else if (bidRatio >= 1.0) {
        score = 40; // At starting bid gets 40%
      } else {
        score = Math.max(0, bidRatio * 40); // Below starting bid gets proportional score
      }

      details.bidAmountDetails = {
        bidAmount,
        startingBid,
        bidRatio,
        score
      };

      return score;

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error in calculateBidAmountScore: ${error.message}`, error);
      return 0;
    }
  }

  /**
   * Calculate experience score
   * @param {number} yearOfExperience - Years of experience from bid
   * @param {Object} userProfile - User profile
   * @param {Object} details - Details object
   * @returns {number} - Experience score (0-100)
   */
  calculateExperienceScore(yearOfExperience, userProfile, details) {
    try {
      let score = 0;
      const experienceDetails = {};

      // Score based on years of experience
      if (yearOfExperience >= 5) {
        score = 100;
      } else if (yearOfExperience >= 3) {
        score = 80;
      } else if (yearOfExperience >= 2) {
        score = 60;
      } else if (yearOfExperience >= 1) {
        score = 40;
      } else {
        score = 20;
      }

      experienceDetails.yearsOfExperience = yearOfExperience;
      experienceDetails.yearsScore = score;

      // Bonus for completed projects (if profile exists)
      if (userProfile && userProfile.user_completed_projects) {
        const completedProjects = userProfile.user_completed_projects;
        let projectBonus = 0;

        if (completedProjects >= 20) {
          projectBonus = 20;
        } else if (completedProjects >= 10) {
          projectBonus = 15;
        } else if (completedProjects >= 5) {
          projectBonus = 10;
        } else if (completedProjects >= 2) {
          projectBonus = 5;
        }

        score = Math.min(100, score + projectBonus);
        experienceDetails.completedProjects = completedProjects;
        experienceDetails.projectBonus = projectBonus;
      }

      details.experienceDetails = experienceDetails;
      return score;

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error in calculateExperienceScore: ${error.message}`, error);
      return 0;
    }
  }

  /**
   * Calculate availability score
   * @param {number} hoursAvailable - Hours available per week
   * @param {Object} details - Details object
   * @returns {number} - Availability score (0-100)
   */
  calculateAvailabilityScore(hoursAvailable, details) {
    try {
      let score = 0;

      if (hoursAvailable >= 40) {
        score = 100; // Full-time availability
      } else if (hoursAvailable >= 30) {
        score = 90;
      } else if (hoursAvailable >= 20) {
        score = 75;
      } else if (hoursAvailable >= 15) {
        score = 60;
      } else if (hoursAvailable >= 10) {
        score = 40;
      } else if (hoursAvailable >= 5) {
        score = 20;
      } else {
        score = 0;
      }

      details.availabilityDetails = {
        hoursAvailable,
        score
      };

      return score;

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error in calculateAvailabilityScore: ${error.message}`, error);
      return 0;
    }
  }

  /**
   * Convert proficiency string to number
   * @param {string} proficiency - Proficiency level
   * @returns {number} - Numeric proficiency (1-5)
   */
  convertProficiencyToNumber(proficiency) {
    const proficiencyMap = {
      'Beginner': 1,
      'Intermediate': 2,
      'Advanced': 3,
      'Expert': 4,
      'Experienced': 3
    };

    return proficiencyMap[proficiency] || 1;
  }

  /**
   * Execute automatic selection for a project
   * @param {string} projectId - Project ID
   * @param {Object} selectionConfig - Selection configuration
   * @returns {Object} - Selection result
   */
  async executeAutomaticSelection(projectId, selectionConfig) {
    try {
      this.logger.info(`[SelectionAlgorithm] Executing automatic selection for project: ${projectId}`);

      // Get ranked bidders
      const rankedBidders = await this.selectBidders(projectId, selectionConfig);

      if (rankedBidders.length === 0) {
        return {
          success: false,
          message: 'No qualified bidders found',
          selectedUsers: []
        };
      }

      // Select top bidders based on required contributors
      const selectedUsers = rankedBidders
        .slice(0, selectionConfig.requiredContributors)
        .map((bidder, index) => ({
          userId: bidder.userId,
          bidId: bidder.bidId,
          selectionScore: Math.round(bidder.scores.totalScore),
          selectionReason: 'automatic',
          skillMatchScore: Math.round(bidder.scores.skillMatch),
          bidAmountScore: Math.round(bidder.scores.bidAmount),
          experienceScore: Math.round(bidder.scores.experience),
          availabilityScore: Math.round(bidder.scores.availability),
          rank: index + 1
        }));

      this.logger.info(`[SelectionAlgorithm] Automatic selection completed. Selected: ${selectedUsers.length} users`);

      return {
        success: true,
        message: `Successfully selected ${selectedUsers.length} users`,
        selectedUsers,
        totalBidders: rankedBidders.length
      };

    } catch (error) {
      this.logger.error(`[SelectionAlgorithm] Error in executeAutomaticSelection: ${error.message}`, error);
      throw error;
    }
  }
}

export default new SelectionAlgorithm();
