import mongoose from "mongoose";
import user from "./UserModel.js"; // Importing the User model
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
  "Other",
];

const ProjectListingSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference to the User model
    required: true,
  },
  project_Title: {
    type: String,
    required: true,
  },
  project_duration: {
    type: Date,
    required: true,
  },
  project_starting_bid: {
    type: Number,
    required: true,
  },
  Project_Bid_Amount: {
    type: Number,
    default: 0,
  },
  Project_Contributor: {
    type: Number,
    required: true,
  },
  Project_Number_Of_Bids: {
    type: Number,
    required: true,
    default: 0,
  },
  Project_Description: {
    type: String,
    required: true,
  },
  Project_tech_stack: {
    type: String,
    required: true,
    enum: TechStackEnum,
  },
  Project_Features: {
    type: String,
    required: true,
  },
  Project_looking: {
    type: String,
    required: true,
  },
  Project_gitHub_link: {
    type: String,
    required: true,
  },
  Project_cover_photo: {
    type: String,
    required: false,
  },
  Project_images: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number
  }]
}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

const ProjectListing = mongoose.model("ProjectListing", ProjectListingSchema); // Capital "P" and "L"
export default ProjectListing;
