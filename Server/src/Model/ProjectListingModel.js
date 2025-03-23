import mongoose from "mongoose";

const ProjectListingSchema = new mongoose.Schema({
    project_Title : {
        type : String,
        required : true
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
    Project_Domain : {
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
    Project_Duration : {
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
