import mongoose from "mongoose";

const ProjectListingSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    project_Title : {
        type : String,
        required : true
    },
    project_duration : {
      type : Number,
      required : true ,
    },
    Project_Bid_Amount : {
         type : Number ,
         required : true, 

    },
    Project_Contributor : {
        type : Number , 
        required : true , 
    }, 
    Project_Number_Of_Bids : {
        type : Number,
        required : true , 
    },
    Project_Description : {
        type : String,
        required : true
    },
    Project_tech_stack : {
        type : String,
        required : true,
    },
    Project_Features : {
        type : String,
        required : true
    },
    Project_looking : {
        type : String,
        required : true
    }, 
    Project_gitHub_link : {
        type : String,
        required : true,
    },
    Project_cover_photo : {
        type : String,
        required : true
    }
});


const ProjectListing = mongoose.model("projectListing", ProjectListingSchema) ; 

export default ProjectListing ;
