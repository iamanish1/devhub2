import user from "./UserModel";
import mongoose from "mongoose";
import ProjectListing from "./ProjectListingModel.js";

const UserProfileSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
   user_name : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'user',
    required : true,
   },
   user_profile_email : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'user',
    required : true,
   },
   user_profile_usertype : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'user',
    required : true,
   }, 
    user_profile_skills : {
     type : [String],
     required : true,
    },
    user_profile_bio : {
        type : String,
        required : true,
    }, 
    user_project_contribution :  {
        type : Number,
        required : true,
        default : 0,
    },
    user_completed_projects : {
        type : Number,
        required : true,
        default : 0,
    }, 
    user_profile_cover_photo : {
        type : String,
        required : true,
    },
    user_profile_linkedIn : {
        type : String,
        required : true,
    },
    user_profile_github : {
        type : String,
        required : true,
    },
    user_profile_website : {
        type : String,
        required : true,
    },
    user_profile_location : {
        type : String,
        required : true,
    },
    user_profile_created_at : {
        type : Date,
        default : Date.now,
    }, 
    user_profile_recent_project : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'ProjectListing',
        required : true,
    }

});

  const UserProfile = mongoose.model("UserProfile", UserProfileSchema);

 export default UserProfile;
