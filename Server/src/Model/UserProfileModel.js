import mongoose from "mongoose";
import ProjectListing from "./ProjectListingModel.js";
import user from "./UserModel.js";
const UserProfileSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  user_name: {
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
  user_profile_skills: {
    type: [String],
    required: true,
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

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);

export default UserProfile;
