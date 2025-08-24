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
  FaUsers,
  FaChartBar,
  FaCalendar,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaUpload,
  FaDownload,
  FaFileAlt,
  FaLink,
  FaStar,
  FaTrophy,
  FaCog,
  FaShieldAlt,
} from "react-icons/fa";
import axios from "axios";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../Config/firebase";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { projectTaskApi } from "../services/projectTaskApi";
import { notificationService } from "../services/notificationService";
const Socket_URl =
  import.meta.env.VITE_SOCKET_SERVER || `${import.meta.env.VITE_API_URL}`;

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
  const socket = useRef(null);
  const { user } = useAuth();

  // Enhanced Contribution State
  const [activeTab, setActiveTab] = useState('tasks');
  const [workspace, setWorkspace] = useState(null);
  const [userAccess, setUserAccess] = useState(null);
  const [resources, setResources] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'file',
    url: '',
    description: ''
  });
  const [selectedResource, setSelectedResource] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);

  // Fetch projects from API
  useEffect(() => {
    setProjectsLoading(true);
    setProjectsError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/myproject`, {
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

  // Fetch chat history for the selected project
  useEffect(() => {
    if (!selectedProjectId) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/project/chat/${selectedProjectId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        // Normalize messages to match chat panel expectations
        const normalized = (res.data || []).map(msg => ({
          senderID: msg.senderID || msg.sender || "",
          senderRole: msg.senderRole || (msg.sender === "admin" ? "admin" : "user"),
          senderName: msg.senderName || msg.sender || "User",
          text: msg.text || msg.message || "",
          // ...add any other fields as needed
        }));
        setChat(normalized);
      })
      .catch((err) => {
        console.error("Failed to fetch chat history:", err);
        setChat([]);
      });
  }, [selectedProjectId]);

  // Socket connection and room join
  useEffect(() => {
    if (!selectedProjectId) return;
    socket.current = io(Socket_URl, {
      auth: { token: localStorage.getItem("token") },
    });
    socket.current.on("connect", () => {
      console.log("✅ Admin Socket connected! ID:", socket.current.id);
    });
    socket.current.on("connect_error", (err) => {
      console.error("❌ Admin Socket connection error:", err.message);
    });
    socket.current.emit("joinRoom", selectedProjectId);
    socket.current.on("receiveMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Admin received message:", msg);
    });
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
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
          `${import.meta.env.VITE_API_URL}/api/admin/editprojecttask/${
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
          `${import.meta.env.VITE_API_URL}/api/admin/projecttask`,
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
        `${import.meta.env.VITE_API_URL}/api/admin/deleteprojecttask/${id}`,
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

  // Send message via socket
  const sendMessage = () => {
    if (message.trim() && socket.current && user?._id) {
      const msgObj = {
        projectId: selectedProjectId,
        senderID: user._id,
        senderRole: user.role || "admin",
        senderName: user.name || "Admin",
        text: message,
      };
      socket.current.emit("sendMessage", msgObj);
      setMessage("");
    }
  };

  // Notes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (onNotesChange) onNotesChange(e.target.value);
  };

  // Enhanced Tab Configuration
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: FaRegStickyNote, color: 'blue' },
    { id: 'team', label: 'Team', icon: FaUsers, color: 'purple' },
    { id: 'resources', label: 'Resources', icon: FaFolderOpen, color: 'green' },
    { id: 'progress', label: 'Progress', icon: FaChartBar, color: 'yellow' },
    { id: 'chat', label: 'Chat', icon: FaComments, color: 'indigo' }
  ];

  // Load workspace data for enhanced features
  const loadWorkspace = async () => {
    if (!selectedProjectId) return;
    
    try {
      const data = await projectTaskApi.getWorkspace(selectedProjectId);
      setWorkspace(data.workspace);
      setUserAccess(data.userAccess);
      
      // Load resources
      if (data.workspace.resources) {
        setResources(data.workspace.resources);
      }
      
      // Load statistics
      try {
        const statsData = await projectTaskApi.getProjectStatistics(selectedProjectId);
        setStatistics(statsData.statistics);
      } catch (statsError) {
        console.error('Failed to load statistics:', statsError);
      }
      
    } catch (err) {
      console.error('Failed to load workspace:', err);
      // Don't show error for workspace loading as it's optional
    }
  };

  // Load workspace when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadWorkspace();
    }
  }, [selectedProjectId]);

  // Enhanced Resource Management
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const formData = new FormData();
      formData.append('name', resourceForm.name);
      formData.append('type', resourceForm.type);
      formData.append('description', resourceForm.description);
      
      if (resourceForm.type === 'file' && resourceForm.url) {
        formData.append('file', resourceForm.url);
      } else if (resourceForm.type === 'link') {
        formData.append('url', resourceForm.url);
      }

      await projectTaskApi.uploadTaskFile(selectedProjectId, 'resource', formData);
      notificationService.success('Resource added successfully');
      
      // Refresh resources
      loadWorkspace();
      setShowResourceModal(false);
      setResourceForm({ name: '', type: 'file', url: '', description: '' });
    } catch (error) {
      notificationService.error('Failed to add resource');
    }
  };

  // Enhanced Task Management
  const handleEnhancedTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !selectedProjectId) return;

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.desc,
        priority: taskForm.priority || 'medium',
        dueDate: taskForm.dueDate || null,
        status: 'todo'
      };

      if (editTask) {
        await projectTaskApi.updateTask(selectedProjectId, editTask.id, taskData);
        notificationService.success('Task updated successfully');
      } else {
        await projectTaskApi.createTask(selectedProjectId, taskData);
        notificationService.success('Task created successfully');
      }

      // Refresh tasks
      loadWorkspace();
      setShowTaskModal(false);
      setEditTask(null);
      setTaskForm({ title: '', desc: '', priority: 'medium', dueDate: '' });
    } catch (error) {
      notificationService.error('Failed to save task');
    }
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

      {/* Enhanced Tab Navigation */}
      {selectedProject && selectedProjectId && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b border-blue-500/20">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? `bg-${tab.color}-500 text-white shadow-lg`
                      : `text-gray-300 hover:text-${tab.color}-400 hover:bg-${tab.color}-500/10`
                  }`}
                >
                  <IconComponent className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Tab Content */}
      {selectedProject && selectedProjectId && (
        <div className="w-full min-w-0">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
              {/* TODO */}
              <div className="w-full min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-blue-300 mb-2 flex items-center gap-1">
                  TODO <FaRegStickyNote className="text-blue-400" />
                </h3>
                <div className="space-y-4">
                  {filteredTasks.filter((t) => t.task_status === "todo").length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-blue-500/10">
                      All tasks started!
                    </div>
                  )}
                  {filteredTasks
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
                  {filteredTasks.filter((t) => t.task_status === "inprogress").length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-purple-500/10">
                      No tasks in progress.
                    </div>
                  )}
                  {filteredTasks
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
                  {filteredTasks.filter((t) => t.task_status === "done").length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-green-500/10">
                      No tasks done yet.
                    </div>
                  )}
                  {filteredTasks
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
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-[#232a34] rounded-xl p-6 border border-blue-500/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                  <FaUsers /> Team Members
                </h3>
                <span className="text-sm text-gray-400">
                  {workspace?.teamMembers?.length || 0} members
                </span>
              </div>
              
              {workspace?.teamMembers && workspace.teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspace.teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 hover:border-purple-400 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                          alt={member.name}
                          className="w-12 h-12 rounded-full border-2 border-purple-400"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{member.name}</h4>
                          <p className="text-sm text-gray-400">{member.role}</p>
                          <p className="text-xs text-purple-400">{member.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FaUsers className="text-4xl mx-auto mb-4" />
                  <p>No team members found.</p>
                  <p className="text-sm">Team members will appear here when selected for the project.</p>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="bg-[#232a34] rounded-xl p-6 border border-blue-500/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                  <FaFolderOpen /> Project Resources
                </h3>
                <button
                  onClick={() => setShowResourceModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <FaPlus /> Add Resource
                </button>
              </div>
              
              {resources && resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource, index) => (
                    <div
                      key={index}
                      className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 hover:border-green-400 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {resource.type === 'file' ? (
                            <FaFileAlt className="text-2xl text-green-400" />
                          ) : (
                            <FaLink className="text-2xl text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{resource.name}</h4>
                          <p className="text-sm text-gray-400">{resource.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition"
                              onClick={() => window.open(resource.url, '_blank')}
                            >
                              <FaEye /> View
                            </button>
                            <button
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition"
                              onClick={() => window.open(resource.url, '_blank')}
                            >
                              <FaDownload /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FaFolderOpen className="text-4xl mx-auto mb-4" />
                  <p>No resources found.</p>
                  <p className="text-sm">Add files, links, and other resources for your team.</p>
                </div>
              )}
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="bg-[#232a34] rounded-xl p-6 border border-blue-500/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  <FaChartBar /> Project Progress
                </h3>
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <FaEye /> {showStatistics ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {filteredTasks.length}
                  </div>
                  <div className="text-sm text-gray-400">Total Tasks</div>
                </div>
                <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {filteredTasks.filter(t => t.task_status === 'todo').length}
                  </div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
                <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {filteredTasks.filter(t => t.task_status === 'inprogress').length}
                  </div>
                  <div className="text-sm text-gray-400">In Progress</div>
                </div>
                <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {filteredTasks.filter(t => t.task_status === 'done').length}
                  </div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Overall Progress</span>
                  <span className="text-sm font-medium text-gray-300">{progress}%</span>
                </div>
                <div className="w-full bg-[#181b23] rounded-full h-3 border border-blue-500/20">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Detailed Statistics */}
              {showStatistics && statistics && (
                <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20">
                  <h4 className="font-semibold text-yellow-400 mb-3">Detailed Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Average Task Duration:</span>
                      <span className="text-white ml-2">{statistics.averageTaskDuration || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Team Productivity:</span>
                      <span className="text-white ml-2">{statistics.teamProductivity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Completion Rate:</span>
                      <span className="text-white ml-2">{statistics.completionRate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Active Contributors:</span>
                      <span className="text-white ml-2">{statistics.activeContributors || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 flex flex-col h-96 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <FaComments className="text-blue-400" />
                <span className="font-bold text-white text-lg">
                  Team Chat
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 scrollbar-thin scrollbar-thumb-blue-900/40 scrollbar-track-transparent transition-all hide-scrollbar">
                {chat.map((msg, idx) => {
                  const isMe = user && msg.senderID === user._id;
                  const isAdmin = msg.senderRole === "admin";
                  let bubbleColor = isAdmin
                    ? "bg-gradient-to-br from-green-600 to-green-400 text-white"
                    : isMe
                    ? "bg-gradient-to-br from-pink-500 to-pink-400 text-white"
                    : "bg-gradient-to-br from-blue-600 to-blue-500 text-white";
                  const alignment = isMe ? "justify-end" : "justify-start";
                  const bubbleAlign = isMe ? "items-end" : "items-start";
                  const bubbleRadius = isMe ? "rounded-br-md rounded-tl-2xl rounded-bl-2xl" : "rounded-bl-md rounded-tr-2xl rounded-br-2xl";
                  return (
                    <div
                      key={idx}
                      className={`flex w-full ${alignment} mb-1`}
                    >
                      {!isMe && (
                        <img
                          src={isAdmin ? "https://ui-avatars.com/api/?name=Admin" : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || "User")}`}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full border border-blue-400 shadow-sm mr-2 self-end hidden sm:block"
                        />
                      )}
                      <div className={`flex flex-col ${bubbleAlign} max-w-[90%] sm:max-w-[70%] w-fit`}>
                        <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-xs font-semibold text-blue-200">
                            {isMe ? "You" : msg.senderName || (isAdmin ? "Admin" : "User")}
                          </span>
                          {isAdmin && (
                            <span className="ml-1 px-2 py-0.5 bg-green-700 text-green-200 text-[10px] rounded-full font-bold uppercase">Admin</span>
                          )}
                        </div>
                        <div
                          className={`px-4 py-2 ${bubbleRadius} max-w-full text-sm shadow-md transition-all ${bubbleColor} break-words`}
                        >
                          {msg.text}
                        </div>
                      </div>
                      {isMe && (
                        <img
                          src={user?.photoURL || `https://ui-avatars.com/api/?name=You`}
                          alt="You"
                          className="w-7 h-7 rounded-full border border-pink-400 shadow-sm ml-2 self-end hidden sm:block"
                        />
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <form
                className="flex gap-2 pt-2 border-t border-blue-500/10 bg-[#232a34] sticky bottom-0 z-10 w-full"
                onSubmit={e => {
                  e.preventDefault();
                  sendMessage();
                }}
                autoComplete="off"
              >
                <input
                  className="flex-1 rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm focus:ring-2 focus:ring-blue-400 transition min-w-0"
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  aria-label="Type a message"
                  disabled={false}
                />
                <button
                  type="submit"
                  className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition focus:ring-2 focus:ring-blue-400 flex items-center shadow disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!message.trim()}
                  aria-label="Send message"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Progress & Notes Section */}
      {selectedProject && selectedProjectId && (
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Progress Overview */}
          <div className="flex-1 bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10">
            <div className="flex items-center gap-2 mb-4">
              <FaChartBar className="text-blue-400" />
              <span className="font-bold text-white text-sm sm:text-base">
                Quick Progress Overview
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Overall Progress</span>
                <span className="text-blue-400 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-[#181b23] rounded-full h-2 border border-blue-500/20">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-400">{filteredTasks.filter(t => t.task_status === 'todo').length}</div>
                  <div className="text-xs text-gray-400">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">{filteredTasks.filter(t => t.task_status === 'inprogress').length}</div>
                  <div className="text-xs text-gray-400">In Progress</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">{filteredTasks.filter(t => t.task_status === 'done').length}</div>
                  <div className="text-xs text-gray-400">Completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="w-full lg:w-80 bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10">
            <div className="flex items-center gap-2 mb-4">
              <FaRegStickyNote className="text-blue-400" />
              <span className="font-bold text-white text-sm sm:text-base">
                Project Notes
              </span>
            </div>
            <textarea
              className="w-full h-32 bg-[#181b23] border border-blue-500/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
              placeholder="Add project notes, reminders, or important information..."
              value={notes}
              onChange={handleNotesChange}
            />
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            className="bg-[#232a34] rounded-xl p-6 w-full max-w-md border border-blue-500/20 shadow-2xl flex flex-col gap-4"
            onSubmit={handleEnhancedTaskSubmit}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  className="w-full rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
                  value={taskForm.priority || 'medium'}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
                  value={taskForm.dueDate || ''}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditTask(null);
                  setTaskForm({ title: "", desc: "", priority: 'medium', dueDate: '' });
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

      {/* Enhanced Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            className="bg-[#232a34] rounded-xl p-6 w-full max-w-md border border-blue-500/20 shadow-2xl flex flex-col gap-4"
            onSubmit={handleResourceSubmit}
          >
            <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
              <FaFolderOpen /> Add Resource
            </h3>
            <input
              className="rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
              placeholder="Resource Name"
              value={resourceForm.name}
              onChange={(e) =>
                setResourceForm((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Resource Type</label>
              <select
                className="w-full rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
                value={resourceForm.type}
                onChange={(e) =>
                  setResourceForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="file">File</option>
                <option value="link">Link</option>
              </select>
            </div>
            {resourceForm.type === 'file' ? (
              <input
                type="file"
                className="rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
                onChange={(e) =>
                  setResourceForm((f) => ({ ...f, url: e.target.files[0] }))
                }
                required
              />
            ) : (
              <input
                type="url"
                className="rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
                placeholder="Resource URL"
                value={resourceForm.url}
                onChange={(e) =>
                  setResourceForm((f) => ({ ...f, url: e.target.value }))
                }
                required
              />
            )}
            <textarea
              className="rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
              placeholder="Resource Description"
              value={resourceForm.description}
              onChange={(e) =>
                setResourceForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  setShowResourceModal(false);
                  setResourceForm({ name: '', type: 'file', url: '', description: '' });
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                disabled={!selectedProjectId}
              >
                Add Resource
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
