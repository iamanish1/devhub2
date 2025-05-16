import mongoose from "mongoose";
const TechStackEnum = [
    "MERN Stack",
    "MEAN Stack",
    "MEVN Stack",
    "Next.js",
    "NestJS",
    "Django",
    "Flask",
    "Spring Boot",
    "ASP.NET",
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "TensorFlow",
    "PyTorch",
    "Apache Spark",
    "Solidity",
    "Rust",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "MySQL",
    "MongoDB",
    "PostgreSQL",
    "Firebase",
    "Redis",
    "Unity",
    "Unreal Engine",
    "IoT",
    "C++",
    "Go",
    "Cybersecurity",
    "Other"
  ];

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
      type : Date ,
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
        enum : TechStackEnum,
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
