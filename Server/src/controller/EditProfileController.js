import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";
import mongoose from "mongoose";

export const editUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Use authenticated user's ID
    const {
      user_profile_skills,
      user_profile_bio,
      user_profile_avatar,
      user_profile_linkedIn,
      user_profile_github,
      user_profile_website,
      user_profile_instagram,
      user_profile_location,
      user_profile_phone,
      user_profile_experience,
      skillExperience,
    } = req.body;

    // Find the user's profile directly using userId
    let profile = await UserProfile.findOne({ username: userId });

    if (!profile) {
      // If profile not found, create a new one
      profile = new UserProfile({
        username: userId,
        user_profile_skills: [],
        user_profile_bio: user_profile_bio || "",
        user_profile_avatar: user_profile_avatar || "",
        user_profile_linkedIn: user_profile_linkedIn || "",
        user_profile_github: user_profile_github || "",
        user_profile_website: user_profile_website || "",
        user_profile_instagram: user_profile_instagram || "",
        user_profile_location: user_profile_location || "",
        user_profile_phone: user_profile_phone || "",
        user_profile_experience: user_profile_experience || "",
        user_project_contribution: 0,
        user_completed_projects: 0,
      });
    } else {
      // If profile exists, update the fields
      profile.user_profile_bio = user_profile_bio || profile.user_profile_bio || "";
      profile.user_profile_avatar = user_profile_avatar || profile.user_profile_avatar || "";
      profile.user_profile_linkedIn = user_profile_linkedIn || profile.user_profile_linkedIn || "";
      profile.user_profile_github = user_profile_github || profile.user_profile_github || "";
      profile.user_profile_website = user_profile_website || profile.user_profile_website || "";
      profile.user_profile_instagram = user_profile_instagram || profile.user_profile_instagram || "";
      profile.user_profile_location = user_profile_location || profile.user_profile_location || "";
      profile.user_profile_phone = user_profile_phone || profile.user_profile_phone || "";
      profile.user_profile_experience = user_profile_experience || profile.user_profile_experience || "";
    }

    // Handle skills update with new structure
    if (user_profile_skills && Array.isArray(user_profile_skills)) {
      // Convert skills to new format
      const processedSkills = user_profile_skills.map(skill => {
        // Handle both string and object formats
        if (typeof skill === 'string') {
          const experience = skillExperience && skillExperience[skill] ? skillExperience[skill].years : 1;
          return {
            name: skill,
            category: categorizeSkill(skill),
            experience: experience,
            projects: skillExperience && skillExperience[skill] ? skillExperience[skill].projects : 1,
            proficiency: skillExperience && skillExperience[skill] ? skillExperience[skill].proficiency : 
              (experience >= 3 ? 'Experienced' : experience >= 1 ? 'Intermediate' : 'Beginner'),
            lastUpdated: new Date()
          };
        } else if (skill && typeof skill === 'object') {
          const experience = skill.experience || skill.experienceYears || 1;
          return {
            name: skill.name || skill.skillName || "Unknown Skill",
            category: skill.category || categorizeSkill(skill.name || skill.skillName),
            experience: experience,
            projects: skill.projects || skill.projectsCount || 1,
            proficiency: skill.proficiency || 
              (experience >= 3 ? 'Experienced' : experience >= 1 ? 'Intermediate' : 'Beginner'),
            lastUpdated: new Date()
          };
        }
        return null;
      }).filter(skill => skill !== null);

      profile.user_profile_skills = processedSkills;
    }

    // Helper function to categorize skills
    function categorizeSkill(skillName) {
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

    // Save the new or updated profile
    await profile.save();

    // Populate the user data before sending response
    const populatedProfile = await UserProfile.findOne({ username: userId }).populate(
      "username",
      "-password"
    );

    res.status(200).json({
      message: "Profile updated successfully",
      profile: populatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// New endpoint to update individual skill experience
export const updateSkillExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillName, experience, projects } = req.body;

    const userProfile = await UserProfile.findOne({ username: userId });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Find existing skill or create new one
    let skill = userProfile.user_profile_skills.find(s => s.name === skillName);
    
    if (!skill) {
      const exp = experience || 1;
      skill = {
        name: skillName,
        category: categorizeSkill(skillName),
        experience: exp,
        projects: projects || 1,
        proficiency: exp >= 3 ? 'Experienced' : exp >= 1 ? 'Intermediate' : 'Beginner',
        lastUpdated: new Date()
      };
      userProfile.user_profile_skills.push(skill);
    } else {
      // Update existing skill
      if (experience !== undefined) {
        skill.experience = experience;
        // Auto-update proficiency based on experience
        skill.proficiency = experience >= 3 ? 'Experienced' : experience >= 1 ? 'Intermediate' : 'Beginner';
      }
      if (projects !== undefined) skill.projects = projects;
      skill.lastUpdated = new Date();
    }
    
    await userProfile.save();

    res.status(200).json({
      message: "Skill experience updated successfully",
      skill: skill,
    });
  } catch (error) {
    console.error("Error updating skill experience:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to categorize skills
function categorizeSkill(skillName) {
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




export const getUserProfile = async (req, res) => {
  try {
    console.log("Fetching profile for user:", req.user);
    const userId = req.user._id;
    console.log("User ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid userId:", userId);
      return res.status(400).json({ message: "Invalid userId format" });
    }

    let profile = await UserProfile.findOne({ username: userId }).populate(
      "username",
      "-password"
    );

    console.log("Profile fetched:", profile);

   return res.status(200).json({ profile: profile || null });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
