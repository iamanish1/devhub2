import mongoose from "mongoose";
import ProjectListing from "./ProjectListingModel.js";
import user from "./UserModel.js";

// Enhanced Skill Schema for new profile system
const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'AI/ML', 'Other'],
    default: 'Other'
  },
  experience: {
    type: Number,
    min: 0,
    max: 20,
    default: 1,
  },
  projects: {
    type: Number,
    min: 0,
    max: 100,
    default: 1,
  },
  proficiency: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
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
  // New skills structure - array of skill objects
  user_profile_skills: {
    type: [SkillSchema],
    default: [],
  },
  // Legacy skills field for backward compatibility
  user_profile_skills_legacy: {
    type: [String],
    default: [],
  },
  user_profile_bio: {
    type: String,
    default: "",
  },
  user_profile_phone: {
    type: String,
    default: "",
  },
  user_profile_experience: {
    type: String,
    default: "",
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
  user_profile_avatar: {
    type: String,
    default: "",
  },
  user_profile_linkedIn: {
    type: String,
    default: "",
  },
  user_profile_github: {
    type: String,
    default: "",
  },
  user_profile_website: {
    type: String,
  },
  user_profile_instagram: {
    type: String,
    default: "",
  }, 
  user_profile_location: {
    type: String,
    default: "",
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

// Pre-save middleware to update skill proficiency based on experience
UserProfileSchema.pre('save', function(next) {
  if (this.user_profile_skills && this.user_profile_skills.length > 0) {
    this.user_profile_skills.forEach(skill => {
      // Update proficiency level based on experience years
      if (skill.experience >= 5) {
        skill.proficiency = 'Expert';
      } else if (skill.experience >= 3) {
        skill.proficiency = 'Advanced';
      } else if (skill.experience >= 1) {
        skill.proficiency = 'Intermediate';
      } else {
        skill.proficiency = 'Beginner';
      }
      
      // Update last updated timestamp
      skill.lastUpdated = new Date();
    });
  }
  next();
});

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);

export default UserProfile;
