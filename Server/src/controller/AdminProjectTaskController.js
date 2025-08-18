import ProjectTask from "../Model/ProjectTaskModel.js";
import { firestoreDb } from "../config/firebaseAdmin.js";

export const createProjectTask = async (req, res) => {
  try {
    const { task_title, task_description, task_status, projectId } = req.body;
    const { taskId } = req.params;
    // Validate required fields
    if (!task_title || !task_description) {
      return res.status(400).json({
        message: "Task title, description, and project ID are required.",
      });
    }

    // Create a new project task
    const newTask = new ProjectTask({
      task_title,
      task_description,
      task_status: task_status || "todo", // Default to "todo" if not provided
      projectId,
    });

    // Save the task to the database
    const savedTask = await newTask.save();
    // Sync the updated task status to Firestore (if available)
    if (firestoreDb) {
      try {
        await firestoreDb
          .collection("project_tasks")
          .doc(savedTask._id.toString())
          .set(
            {
              task_status: savedTask.task_status,
              updated_at: new Date(),
              projectId: savedTask.projectId.toString(),
              task_title: savedTask.task_title,
              task_description: savedTask.task_description,
            },
            { merge: true }
          );
        console.log("Firestore Sync Data:", {
          task_status: savedTask.task_status,
          updated_at: new Date(),
        });
      } catch (firestoreError) {
        console.warn("Firestore sync failed:", firestoreError.message);
      }
    }

    res
      .status(201)
      .json({ message: "Project task created successfully", task: savedTask });
  } catch (error) {
    console.error("Error creating project task:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log("Fetching tasks for project ID:", projectId);
    // Validate projectId
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required." });
    }

    // Fetch tasks for the given project
    const tasks = await ProjectTask.find({ projectId }).populate(
      "projectId",
      "title"
    ); // Populate project title

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    res.status(500).json({ message: "Internal server error" || error.message });
  }
};

// Update a project tasl status function  :

export const updateProjectTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params; // Get task ID from request parameters
    const { task_status } = req.body; // Get new status from request body

    // Validate required fields
    if (!taskId || !task_status) {
      return res
        .status(400)
        .json({ message: "Task ID and status are required." });
    }

    // Update the task status
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { task_status },
      { new: true } // Return the updated document
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Sync the updated task status to Firestore
    await firestoreDb.collection("project_tasks").doc(taskId).set(
      {
        task_status: updatedTask.task_status,
        updated_at: new Date(),
        projectId: updatedTask.projectId.toString(), // <-- Add this line!
        task_title: updatedTask.task_title, // (optional, for full sync)
        task_description: updatedTask.task_description, // (optional)
      },
      { merge: true } // This will create the document if it doesn't exist
    );
    console.log("Firestore Sync Data:", {
      task_status: updatedTask.task_status,
      updated_at: new Date(),
    });

    res
      .status(200)
      .json({ message: "Task status updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating project task status:", error);
    res.status(500).json({ message: "Internal server error" || error.message });
  }
};

// Delete a project task function :

export const deleteProjectTask = async (req, res) => {
  try {
    const { taskId } = req.params; // Get task ID from request parameters

    // Validate required fields
    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required." });
    }

    // Delete the task
    const deletedTask = await ProjectTask.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Also delete the task from Firestore
    await firestoreDb.collection("project_tasks").doc(taskId).delete();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting project task:", error);
    res.status(500).json({ message: "Internal server error" || error.message });
  }
};

//  for updating the task details of any task :
export const updateProjectTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params; // Get task ID from request parameters
    const { task_title, task_description, task_status } = req.body; // Get new details from request body

    // Validate required fields
    if (!taskId || !task_title || !task_description) {
      return res.status(400).json({
        message: "Task ID, title, and description are required.",
      });
    }

    // Update the task details
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { task_title, task_description, task_status },
      { new: true } // Return the updated document
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Sync the updated task details to Firestore
    await firestoreDb.collection("project_tasks").doc(taskId).set(
      {
        task_title: updatedTask.task_title,
        task_description: updatedTask.task_description,
        task_status: updatedTask.task_status,
        updated_at: new Date(),
        projectId: updatedTask.projectId.toString(), // <-- Add this line!
      },
      { merge: true } // This will create the document if it doesn't exist
    );
    console.log("Firestore Sync Data:", {
      task_title: updatedTask.task_title,
      task_description: updatedTask.task_description,
      task_status: updatedTask.task_status,
      updated_at: new Date(),
    });

    res
      .status(200)
      .json({ message: "Task details updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating project task details:", error);
    res.status(500).json({ message: "Internal server error" || error.message });
  }
}
