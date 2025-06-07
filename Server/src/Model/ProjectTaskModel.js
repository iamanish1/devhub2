import mongoose from "mongoose";
import ProjectListing from "./ProjectListingModel.js";

const ProjectTaskSchema = new mongoose.Schema({
  task_title: {
    type: String,
    required: true,
  },
  task_description: {
    type: String,
    required: true,
  },
  task_status: {
    type: String,
    enum: ["todo", "In Progress", "Completed"],
    default: "todo",
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProjectListing", // Reference to the ProjectListing model
   
  },
  createdAt: { type: Date, default: Date.now },
});


const ProjectTask = mongoose.model("ProjectTask", ProjectTaskSchema);
export default ProjectTask;