import UserProfile from "../Model/UserProfileModel.js";
import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";

class SkillProficiencyService {
  
  // Calculate proficiency based on multiple factors
  static calculateSkillProficiency(skill) {
    let proficiency = 0;
    
    // Base proficiency from user input (30% weight)
    proficiency += (skill.proficiency * 0.3);
    
    // Experience years factor (25% weight)
    const experienceScore = Math.min(skill.experienceYears * 10, 100);
    proficiency += (experienceScore * 0.25);
    
    // Projects count factor (20% weight)
    const projectsScore = Math.min(skill.projectsCount * 5, 100);
    proficiency += (projectsScore * 0.2);
    
    // Endorsements factor (15% weight)
    const endorsementsScore = Math.min(skill.endorsements * 2, 100);
    proficiency += (endorsementsScore * 0.15);
    
    // Recency factor (10% weight) - penalize if not used recently
    const daysSinceLastUsed = Math.floor((Date.now() - skill.lastUsed) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, 100 - (daysSinceLastUsed * 0.5));
    proficiency += (recencyScore * 0.1);
    
    return Math.round(Math.min(proficiency, 100));
  }

  // Update skill proficiency when user completes a project
  static async updateSkillProficiencyOnProjectCompletion(userId, projectId, skillsUsed) {
    try {
      const userProfile = await UserProfile.findOne({ username: userId });
      if (!userProfile) return;

      // Get project details to understand complexity
      const project = await ProjectListing.findById(projectId);
      if (!project) return;

      // Update each skill used in the project
      for (const skillName of skillsUsed) {
        let skill = userProfile.user_profile_skills.find(s => s.skillName === skillName);
        
        if (!skill) {
          // Create new skill entry
          skill = {
            skillName,
            proficiency: 50, // Default starting proficiency
            experienceYears: 0,
            projectsCount: 0,
            endorsements: 0,
            category: this.categorizeSkill(skillName),
            lastUsed: new Date()
          };
          userProfile.user_profile_skills.push(skill);
        }

        // Update skill metrics
        skill.projectsCount += 1;
        skill.lastUsed = new Date();
        
        // Increase experience if this is a significant project
        if (project.Project_Contributor > 1) {
          skill.experienceYears += 0.1; // Small increment for collaborative projects
        }
        
        // Recalculate proficiency
        skill.calculatedProficiency = this.calculateSkillProficiency(skill);
      }

      await userProfile.save();
      return userProfile;
    } catch (error) {
      console.error('Error updating skill proficiency:', error);
      throw error;
    }
  }

  // Update skill proficiency when user receives endorsement
  static async updateSkillProficiencyOnEndorsement(userId, skillName) {
    try {
      const userProfile = await UserProfile.findOne({ username: userId });
      if (!userProfile) return;

      const skill = userProfile.user_profile_skills.find(s => s.skillName === skillName);
      if (skill) {
        skill.endorsements += 1;
        skill.calculatedProficiency = this.calculateSkillProficiency(skill);
        await userProfile.save();
      }

      return userProfile;
    } catch (error) {
      console.error('Error updating skill endorsement:', error);
      throw error;
    }
  }

  // Categorize skills automatically
  static categorizeSkill(skillName) {
    const skillNameLower = skillName.toLowerCase();
    
    const categories = {
      'Frontend': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'typescript', 'tailwind', 'bootstrap', 'sass', 'less'],
      'Backend': ['node', 'express', 'python', 'django', 'flask', 'java', 'spring', 'php', 'laravel', 'c#', 'asp.net'],
      'Database': ['mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'supabase', 'sqlite', 'oracle'],
      'DevOps': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'git', 'ci/cd', 'terraform', 'ansible'],
      'Mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ionic', 'xamarin'],
      'AI/ML': ['tensorflow', 'pytorch', 'scikit-learn', 'openai', 'hugging face', 'pandas', 'numpy', 'matplotlib']
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(skill => skillNameLower.includes(skill))) {
        return category;
      }
    }
    
    return 'Other';
  }

  // Get skill proficiency level (Beginner, Intermediate, Advanced, Expert)
  static getSkillLevel(proficiency) {
    if (proficiency >= 90) return 'Expert';
    if (proficiency >= 80) return 'Advanced';
    if (proficiency >= 70) return 'Intermediate';
    if (proficiency >= 50) return 'Beginner';
    return 'Novice';
  }

  // Analyze user's skill growth over time
  static async analyzeSkillGrowth(userId, timePeriod = '6months') {
    try {
      const userProfile = await UserProfile.findOne({ username: userId });
      if (!userProfile) return null;

      const analysis = {
        topSkills: [],
        growingSkills: [],
        decliningSkills: [],
        recommendations: []
      };

      // Sort skills by proficiency
      const sortedSkills = userProfile.user_profile_skills
        .sort((a, b) => b.calculatedProficiency - a.calculatedProficiency);

      analysis.topSkills = sortedSkills.slice(0, 5);

      // Identify skills that need attention (low recency or low proficiency)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      analysis.decliningSkills = userProfile.user_profile_skills.filter(skill => {
        const daysSinceLastUsed = Math.floor((now - skill.lastUsed) / (1000 * 60 * 60 * 24));
        return daysSinceLastUsed > 30 && skill.calculatedProficiency < 70;
      });

      // Generate recommendations
      if (analysis.decliningSkills.length > 0) {
        analysis.recommendations.push(
          `Consider practicing ${analysis.decliningSkills[0].skillName} to maintain proficiency`
        );
      }

      if (userProfile.user_profile_skills.length < 5) {
        analysis.recommendations.push(
          'Consider adding more skills to diversify your profile'
        );
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing skill growth:', error);
      throw error;
    }
  }

  // Migrate legacy skills data
  static async migrateLegacySkills(userId) {
    try {
      const userProfile = await UserProfile.findOne({ username: userId });
      if (!userProfile || !userProfile.user_profile_skills_legacy) return;

      // Convert legacy string skills to new format
      for (const skillName of userProfile.user_profile_skills_legacy) {
        const existingSkill = userProfile.user_profile_skills.find(s => s.skillName === skillName);
        if (!existingSkill) {
          userProfile.user_profile_skills.push({
            skillName,
            proficiency: 60, // Default proficiency
            experienceYears: 1, // Default experience
            projectsCount: 1, // Default project count
            endorsements: 0,
            category: this.categorizeSkill(skillName),
            lastUsed: new Date(),
            calculatedProficiency: 60
          });
        }
      }

      // Clear legacy data
      userProfile.user_profile_skills_legacy = [];
      await userProfile.save();

      return userProfile;
    } catch (error) {
      console.error('Error migrating legacy skills:', error);
      throw error;
    }
  }
}

export default SkillProficiencyService;
