import ProjectTask from "../Model/ProjectTaskModel.js";

export const createProjectTask = async (req, res) => {
    try {

        const { task_title, task_description, task_status , projectId} = req.body;

        // Validate required fields
        if (!task_title || !task_description) {
            return res.status(400).json({ message: "Task title, description, and project ID are required." }
            );
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

        res.status(201).json({ message: "Project task created successfully", task: savedTask });
        
    } catch (error) {
        console.error("Error creating project task:", error);
        res.status(500).json({ message: error.message ||"Internal server error"  }, );
    }
}


export const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log("Fetching tasks for project ID:", projectId);
        // Validate projectId
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        // Fetch tasks for the given project
        const tasks = await ProjectTask.find({ projectId }).populate('projectId', 'title'); // Populate project title

        res.status(200).json(tasks);
        
    } catch (error) {
        console.error("Error fetching project tasks:", error);
        res.status(500).json({ message: "Internal server error" || error.message });
    }
}