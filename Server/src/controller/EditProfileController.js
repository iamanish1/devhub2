import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";
import mongoose from "mongoose";
import SkillProficiencyService from "../services/skillProficiencyService.js";

export const editUserProfile = async (req, res) => {
  try {
    const username = req.user?.username || req.body.username;
    const {
      user_profile_skills,
      user_profile_bio,
      user_profile_cover_photo,
      user_profile_linkedIn,
      user_profile_github,
      user_profile_website,
      user_profile_instagram,
      user_profile_location,
    } = req.body;

    // Find the user first
    const User = await user.findOne({ username });
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's profile
    let profile = await UserProfile.findOne({ username: User._id });

    if (!profile) {
      // If profile not found, create a new one
      profile = new UserProfile({
        username: User._id,
        user_profile_skills: [],
        user_profile_bio,
        user_profile_cover_photo,
        user_profile_linkedIn,
        user_profile_github,
        user_profile_website,
        user_profile_instagram,
        user_profile_location,
        user_project_contribution: 0,
        user_completed_projects: 0,
      });
    } else {
      // If profile exists, update the fields
      profile.user_profile_bio = user_profile_bio;
      profile.user_profile_cover_photo = user_profile_cover_photo;
      profile.user_profile_linkedIn = user_profile_linkedIn;
      profile.user_profile_github = user_profile_github;
      profile.user_profile_website = user_profile_website;
      profile.user_profile_instagram = user_profile_instagram;
      profile.user_profile_location = user_profile_location;
    }

    // Handle skills update - convert legacy format to new format
    if (user_profile_skills && Array.isArray(user_profile_skills)) {
      // If it's the new format (array of objects)
      if (user_profile_skills.length > 0 && typeof user_profile_skills[0] === 'object') {
        profile.user_profile_skills = user_profile_skills.map(skill => ({
          skillName: skill.name || skill.skillName,
          proficiency: skill.proficiency || 60,
          experienceYears: skill.experienceYears || skill.experience || 1,
          projectsCount: skill.projectsCount || skill.projects || 1,
          endorsements: skill.endorsements || 0,
          category: skill.category || SkillProficiencyService.categorizeSkill(skill.name || skill.skillName),
          lastUsed: skill.lastUsed || new Date(),
          calculatedProficiency: skill.calculatedProficiency || 60
        }));
      } else {
        // If it's the legacy format (array of strings)
        profile.user_profile_skills_legacy = user_profile_skills;
        // Migrate legacy skills to new format
        await SkillProficiencyService.migrateLegacySkills(User._id);
      }
    }

    // Save the new or updated profile
    await profile.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profile: profile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// New endpoint to update skill proficiency
export const updateSkillProficiency = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillName, proficiency, experienceYears, projectsCount } = req.body;

    const userProfile = await UserProfile.findOne({ username: userId });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Find existing skill or create new one
    let skill = userProfile.user_profile_skills.find(s => s.skillName === skillName);
    
    if (!skill) {
      skill = {
        skillName,
        proficiency: proficiency || 60,
        experienceYears: experienceYears || 0,
        projectsCount: projectsCount || 0,
        endorsements: 0,
        category: SkillProficiencyService.categorizeSkill(skillName),
        lastUsed: new Date(),
        calculatedProficiency: 0
      };
      userProfile.user_profile_skills.push(skill);
    } else {
      // Update existing skill
      if (proficiency !== undefined) skill.proficiency = proficiency;
      if (experienceYears !== undefined) skill.experienceYears = experienceYears;
      if (projectsCount !== undefined) skill.projectsCount = projectsCount;
      skill.lastUsed = new Date();
    }

    // Recalculate proficiency
    skill.calculatedProficiency = SkillProficiencyService.calculateSkillProficiency(skill);
    
    await userProfile.save();

    res.status(200).json({
      message: "Skill proficiency updated successfully",
      skill: skill,
    });
  } catch (error) {
    console.error("Error updating skill proficiency:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// New endpoint to get skill analysis
export const getSkillAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timePeriod } = req.query;

    const analysis = await SkillProficiencyService.analyzeSkillGrowth(userId, timePeriod);
    
    if (!analysis) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json({
      message: "Skill analysis retrieved successfully",
      analysis: analysis,
    });
  } catch (error) {
    console.error("Error getting skill analysis:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// New endpoint to endorse a skill
export const endorseSkill = async (req, res) => {
  try {
    const { userId, skillName } = req.body;
    const endorserId = req.user._id;

    // Prevent self-endorsement
    if (userId === endorserId.toString()) {
      return res.status(400).json({ message: "Cannot endorse your own skills" });
    }

    const updatedProfile = await SkillProficiencyService.updateSkillProficiencyOnEndorsement(userId, skillName);
    
    if (!updatedProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json({
      message: "Skill endorsed successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error endorsing skill:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};




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
