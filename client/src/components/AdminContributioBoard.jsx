/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import {
  FaCheck,
  FaEdit,
  FaRegStickyNote,
  FaPaperPlane,
  FaComments,
  FaBars,
  FaUser,
  FaTrash,
  FaPlus,
  FaPen,
  FaFolderOpen,
  FaChevronDown,
  FaRobot,
} from "react-icons/fa";
import axios from "axios";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../Config/firebase";

const AdminContributionBoard = ({
  tasks: initialTasks = [],
  chat: initialChat = [],
  team = [],
  notes: initialNotes = "",
  onTaskStatusChange,
  onSendMessage,
  onNotesChange,
  onTaskAdd,
  onTaskEdit,
  onTaskDelete,
}) => {
  // State
  const [tasks, setTasks] = useState(initialTasks);
  const [chat, setChat] = useState(initialChat);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAiTaskModal, setShowAiTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", desc: "" });
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const chatEndRef = useRef(null);

  // Fetch projects from API
  useEffect(() => {
    setProjectsLoading(true);
    setProjectsError(null);
    axios
      .get("http://localhost:8000/api/admin/myproject", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        // Only use id, title, description
        const fetchedProjects = (res.data.projects || []).map((proj) => ({
          id: proj._id,
          title: proj.project_Title,
          description: proj.Project_Description,
        }));
        console.log("Fetched Projects:", fetchedProjects);
        setProjects(fetchedProjects);
        // Set selected project to first if not already set or if current is not in list
        if (
          fetchedProjects.length > 0 &&
          !fetchedProjects.find((p) => p.id === selectedProjectId)
        ) {
          setSelectedProjectId(fetchedProjects[0].id);
        }
        if (fetchedProjects.length === 0) setSelectedProjectId("");
      })
      .catch(() => setProjectsError("Failed to fetch projects"))
      .finally(() => setProjectsLoading(false));
    // eslint-disable-next-line
  }, []);

  // Firestore real-time listener for tasks
  useEffect(() => {
    if (!selectedProjectId) return;
    console.log(
      "Setting up Firestore listener for project:",
      selectedProjectId
    );
    const q = query(
      collection(db, "project_tasks"),
      where("projectId", "==", selectedProjectId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = [];
      if (querySnapshot.empty) {
        console.log(
          "No tasks found in Firestore for project:",
          selectedProjectId
        );
        setTasks([]);
        return;
      }
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      console.log("Fetched tasks from Firestore:", tasksData);
      setTasks(tasksData);
    });
    return () => {
      console.log(
        "Unsubscribing Firestore listener for project:",
        selectedProjectId
      );
      unsubscribe();
    };
  }, [selectedProjectId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Update selected project if projects change
  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.find((p) => p.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0].id);
    }
    if (projects.length === 0) setSelectedProjectId("");
  }, [projects, selectedProjectId]);

  // Filter tasks by selected project
  const filteredTasks = tasks.filter((t) => t.projectId === selectedProjectId);


  // Add/Edit Task
  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (editTask) {
      // Edit logic: call update API
      try {
        const res = await axios.put(
          `http://localhost:8000/api/admin/editprojecttask/${
            editTask.id || editTask._id
          }`,
          {
            task_title: taskForm.title,
            task_description: taskForm.desc,
            task_status: editTask.task_status,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Updated Task:", res.data);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === (editTask.id || editTask._id)
              ? {
                  ...t,
                  task_title: taskForm.title,
                  task_description: taskForm.desc,
                }
              : t
          )
        );
        if (onTaskEdit)
          onTaskEdit(editTask.id || editTask._id, {
            ...taskForm,
            projectId: selectedProjectId,
          });
      } catch (err) {
        console.error("Error updating task:", err);
        alert("Failed to update task.");
        return;
      }
    } else {
      // Create new task via API call
      try {
        const res = await axios.post(
          `http://localhost:8000/api/admin/projecttask`,
          {
            task_title: taskForm.title,
            task_description: taskForm.desc,
            projectId: selectedProjectId,
            task_status: "todo",
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Created Task:", res.data);
        setTasks((prev) => [res.data, ...prev]);
        if (onTaskAdd) onTaskAdd(res.data);
      } catch (err) {
        console.error("Error creating task:", err);
        alert("Failed to create task.");
        return;
      }
    }

    setShowTaskModal(false);
    setEditTask(null);
    setTaskForm({ title: "", desc: "" });
  };

  // Dummy AI Task Add
  const handleAiTaskAdd = () => {
    const aiTask = {
      id: Date.now(),
      title: "AI Suggested Task",
      desc: "This task was generated by AI for your project.",
      status: "todo",
      projectId: selectedProjectId,
    };
    setTasks((prev) => [aiTask, ...prev]);
    setShowAiTaskModal(false);
    if (onTaskAdd) onTaskAdd(aiTask);
  };

  // Delete Task
  const handleTaskDelete = async (id) => {
    if (!id) return;
    try {
      const res = await axios.delete(
        `http://localhost:8000/api/admin/deleteprojecttask/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Deleted Task:", res.data);
      setTasks((prev) => prev.filter((t) => t.id !== id && t._id !== id));
      if (onTaskDelete) onTaskDelete(id);
      setEditTask(null);
      setTaskForm({ title: "", desc: "" });
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task.");
    }
  };

  // Open modal for edit/add
  const openEditModal = (task) => {
    setEditTask(task);
    setTaskForm({ title: task.task_title, desc: task.task_description });
    setShowTaskModal(true);
  };
  const openAddModal = () => {
    setEditTask(null);
    setTaskForm({ title: "", desc: "" });
    setShowTaskModal(true);
  };

  // Chat send
  const sendMessage = () => {
    if (message.trim()) {
      const newMsg = { sender: "admin", text: message };
      setChat((prev) => [...prev, newMsg]);
      setMessage("");
      if (onSendMessage) onSendMessage(newMsg);
    }
  };

  // Notes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (onNotesChange) onNotesChange(e.target.value);
  };

  // Progress
  const doneCount = filteredTasks.filter(
    (t) => t.task_status === "done"
  ).length;
  const totalCount = filteredTasks.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Get selected project object
  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0] || {};

  return (
    <div className="w-full bg-[#181b23] rounded-2xl shadow-lg border border-blue-500/20 p-4 sm:p-6 flex flex-col gap-8 overflow-x-hidden">
      {/* My Projects Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FaFolderOpen className="text-blue-400 text-xl" />
          <span className="text-lg sm:text-xl font-bold text-blue-300">
            My Projects
          </span>
        </div>
        <div className="relative w-full sm:w-auto">
          <button
            className="flex items-center justify-between w-full sm:w-64 bg-[#232a34] border border-blue-500/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition hover:border-blue-400"
            onClick={() => setShowProjectDropdown((v) => !v)}
            type="button"
            disabled={projectsLoading || projects.length === 0}
          >
            <span className="truncate">
              {projectsLoading
                ? "Loading..."
                : selectedProject
                ? selectedProject.title
                : "Select Project"}
            </span>
            <FaChevronDown className="ml-2" />
          </button>
          {/* Dropdown */}
          {showProjectDropdown && (
            <div className="absolute z-20 mt-2 w-full sm:w-64 bg-[#232a34] border border-blue-500/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-900/30 text-white flex items-center justify-between ${
                    selectedProjectId === proj.id
                      ? "bg-blue-900/40 font-bold"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setShowProjectDropdown(false);
                  }}
                >
                  <span className="truncate">{proj.title}</span>
                  {selectedProjectId === proj.id && (
                    <span className="ml-2 text-blue-400 text-xs">Selected</span>
                  )}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="px-4 py-2 text-gray-400">No projects found</div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Project Info & Add Task Buttons */}
      {projectsError && (
        <div className="text-red-400 text-sm mb-2">{projectsError}</div>
      )}
      {selectedProject && selectedProjectId && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-semibold">
              {selectedProject.title}
            </span>
            {selectedProject.description && (
              <span className="text-gray-400 text-xs hidden sm:inline">
                &mdash; {selectedProject.description}
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition text-sm"
              onClick={openAddModal}
              disabled={!selectedProjectId}
            >
              <FaPlus /> Add Task
            </button>
            <button
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg shadow transition text-sm"
              onClick={() => setShowAiTaskModal(true)}
              disabled={!selectedProjectId}
            >
              <FaRobot /> Add Task with AI
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
        {/* TODO */}
        <div className="w-full min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-blue-300 mb-2 flex items-center gap-1">
            TODO <FaRegStickyNote className="text-blue-400" />
          </h3>
          <div className="space-y-4">
            {tasks.filter((t) => t.task_status === "todo").length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-blue-500/10">
                All tasks started!
              </div>
            )}
            {tasks
              .filter((t) => t.task_status === "todo")
              .map((task) => (
                <div
                  key={task.id || task._id}
                  className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 transition hover:scale-[1.01] hover:border-blue-400 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <FaRegStickyNote className="text-blue-400" />{" "}
                      {task.task_title}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition"
                        // onClick={() =>
                        //   updateTaskStatus(task.id || task._id, "inprogress")
                        // }
                        title="Mark In Progress"
                      >
                        In Progress
                      </button>
                      <button
                        className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white"
                        onClick={() => openEditModal(task)}
                        title="Edit"
                      >
                        <FaPen />
                      </button>
                      <button
                        className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white"
                        onClick={() => handleTaskDelete(task.id || task._id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {task.task_description}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className="w-full min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-purple-300 mb-2 flex items-center gap-1">
            IN PROGRESS <FaEdit className="text-purple-400" />
          </h3>
          <div className="space-y-4">
            {tasks.filter((t) => t.task_status === "inprogress").length ===
              0 && (
              <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-purple-500/10">
                No tasks in progress.
              </div>
            )}
            {tasks
              .filter((t) => t.task_status === "inprogress")
              .map((task) => (
                <div
                  key={task.id || task._id}
                  className="bg-[#232a34] rounded-xl p-4 shadow border border-purple-500/10 transition hover:scale-[1.01] hover:border-purple-400 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <FaEdit className="text-purple-400" /> {task.task_title}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition"
                        // onClick={() =>
                        //   updateTaskStatus(task.id || task._id, "done")
                        // }
                        title="Mark as Done"
                      >
                        Done
                      </button>
                      <button
                        className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white"
                        onClick={() => openEditModal(task)}
                        title="Edit"
                      >
                        <FaPen />
                      </button>
                      <button
                        className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white"
                        onClick={() => handleTaskDelete(task.id || task._id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {task.task_description}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* DONE */}
        <div className="w-full min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-green-300 mb-2 flex items-center gap-1">
            DONE <FaCheck className="text-green-400" />
          </h3>
          <div className="space-y-4">
            {tasks.filter((t) => t.task_status === "done").length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-green-500/10">
                No tasks done yet.
              </div>
            )}
            {tasks
              .filter((t) => t.task_status === "done")
              .map((task) => (
                <div
                  key={task.id || task._id}
                  className="bg-[#232a34] rounded-xl p-4 shadow border border-green-500/10 flex items-center justify-between transition hover:scale-[1.01] hover:border-green-400"
                >
                  <div>
                    <span className="font-semibold text-white flex items-center gap-2">
                      <FaCheck className="text-green-400" /> {task.task_title}
                    </span>
                    <p className="text-gray-300 text-sm">
                      {task.task_description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white"
                      onClick={() => openEditModal(task)}
                      title="Edit"
                    >
                      <FaPen />
                    </button>
                    <button
                      className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white"
                      onClick={() => handleTaskDelete(task.id || task._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Chat and Progress */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Chat */}
        <div className="flex-1 bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 flex flex-col h-72 sm:h-80 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FaComments className="text-blue-400" />
            <span className="font-bold text-white text-sm sm:text-base">
              Team Chat
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            {chat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "admin"
                    ? "justify-end"
                    : msg.sender === "mentor"
                    ? "justify-start"
                    : "justify-center"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                    msg.sender === "admin"
                      ? "bg-blue-600 text-white"
                      : msg.sender === "mentor"
                      ? "bg-gray-700 text-blue-200"
                      : "bg-purple-700 text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              aria-label="Type a message"
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg transition focus:ring-2 focus:ring-blue-400 flex items-center"
              onClick={sendMessage}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
        {/* Progress & Notes */}
        <div className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 flex-1 min-w-0 mt-6 lg:mt-0">
          <div className="flex items-center gap-2 mb-2">
            <FaBars className="text-yellow-400" />
            <span className="font-bold text-white text-sm sm:text-base">
              Progress Tracker
            </span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs sm:text-sm text-gray-300 mb-1">
              <span>
                Tasks Done: {doneCount}/{totalCount}
              </span>
              <span>{progress}%</span>
            </div>
            <div
              className="w-full bg-gray-700 rounded-full h-2"
              aria-label="Progress bar"
            >
              <div
                className="bg-gradient-to-r from-blue-400 to-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-gray-400 text-xs mb-1 block" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="w-full rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
              rows={2}
              value={notes}
              onChange={handleNotesChange}
              placeholder="Share progress or blockers..."
              aria-label="Notes"
            />
          </div>
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            className="bg-[#232a34] rounded-xl p-6 w-full max-w-md border border-blue-500/20 shadow-2xl flex flex-col gap-4"
            onSubmit={handleTaskFormSubmit}
          >
            <h3 className="text-lg font-bold text-blue-400 mb-2">
              {editTask ? "Edit Task" : "Add Task"}
            </h3>
            <input
              className="rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
              placeholder="Task Title"
              value={taskForm.title}
              name="title"
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
            <textarea
              className="rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
              placeholder="Task Description"
              name="description"
              value={taskForm.desc}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, desc: e.target.value }))
              }
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditTask(null);
                  setTaskForm({ title: "", desc: "" });
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={!selectedProjectId}
              >
                {editTask ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Task Modal (simple demo) */}
      {showAiTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#232a34] rounded-xl p-6 w-full max-w-md border border-blue-500/20 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
              <FaRobot /> Add Task with AI
            </h3>
            <div className="text-white text-sm mb-4">
              This will add a sample AI-generated task to your project.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowAiTaskModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                onClick={handleAiTaskAdd}
                disabled={!selectedProjectId}
              >
                Add AI Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContributionBoard;
