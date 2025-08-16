import mongoose from "mongoose";
import ProjectListing from "./ProjectListingModel.js";
import user from "./UserModel.js";

// Skill Proficiency Schema
const SkillProficiencySchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: true,
  },
  proficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  experienceYears: {
    type: Number,
    min: 0,
    default: 0,
  },
  projectsCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
  },
  endorsements: {
    type: Number,
    min: 0,
    default: 0,
  },
  category: {
    type: String,
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'AI/ML', 'Other'],
    default: 'Other'
  },
  // Calculated fields
  calculatedProficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  }
});

const UserProfileSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  username: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
   
  },
  user_profile_email: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  
  },
  user_profile_usertype: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    
  },
  // Updated skills field to use detailed schema
  user_profile_skills: {
    type: [SkillProficiencySchema],
    default: [],
  },
  // Keep the old field for backward compatibility
  user_profile_skills_legacy: {
    type: [String],
    default: [],
  },
  user_profile_bio: {
    type: String,
    required: true,
  },
  user_project_contribution: {
    type: Number,
    required: true,
    default: 0,
  },
  user_completed_projects: {
    type: Number,
    required: true,
    default: 0,
  },
  user_profile_cover_photo: {
    type: String,
   
  },
  user_profile_linkedIn: {
    type: String,
    required: true,
  },
  user_profile_github: {
    type: String,
    required: true,
  },
  user_profile_website: {
    type: String,
   
  },
  user_profile_instagram : {
    type: String,
    required: true,
  }, 
  user_profile_location: {
    type: String,
    required: true,
  },
  user_profile_created_at: {
    type: Date,
    default: Date.now,
  },
  user_profile_recent_project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProjectListing",
    
  },
});

// Pre-save middleware to calculate proficiency
UserProfileSchema.pre('save', function(next) {
  if (this.user_profile_skills && this.user_profile_skills.length > 0) {
    this.user_profile_skills.forEach(skill => {
      // Calculate proficiency based on multiple factors
      skill.calculatedProficiency = calculateSkillProficiency(skill);
    });
  }
  next();
});

// Function to calculate skill proficiency
function calculateSkillProficiency(skill) {
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

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);

export default UserProfile;
