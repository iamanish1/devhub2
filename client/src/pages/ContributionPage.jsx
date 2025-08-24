import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/NavBar";
import { useParams } from "react-router-dom";
import {
  FaGithub,
  FaCheck,
  FaEdit,
  FaComments,
  FaBars,
  FaInfoCircle,
  FaRegStickyNote,
  FaPaperPlane,
  FaUsers,
  FaFolder,
  FaChartLine,
  FaTasks,
  FaClock,
  FaUserCircle,
  FaBell,
  FaDownload,
  FaExternalLinkAlt,
  FaRocket,
  FaCopy,
  FaShare,
  FaStar,
  FaTrophy,
  FaCalendarAlt,
  FaCode,
  FaImage,
  FaFile,
  FaVideo,
  FaProjectDiagram,
} from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../Config/firebase";
import io from "socket.io-client";
import { IoTrashBin } from "react-icons/io5";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Socket_URl =
  import.meta.env.VITE_SOCKET_SERVER || `${import.meta.env.VITE_API_URL}`;

// Enhanced mentor data
const mentor = {
  name: "Project Lead",
  avatar: "https://ui-avatars.com/api/?name=Project+Lead&background=00A8E8&color=fff",
  bio: "Senior Developer & Project Lead",
  expertise: "Full Stack, Team Management",
  email: "lead@devhubs.com",
  role: "Project Lead",
  status: "online",
};

const ContributionPage = () => {
  // Core state
  const [tasks, setTasks] = useState([]);
  const [chat, setChat] = useState([]);
  const [project, setProject] = useState();
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteSaved, setNoteSaved] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState("tasks");
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs
  const chatEndRef = useRef(null);
  const socket = useRef(null);
  const { user } = useAuth();
  const { _id } = useParams();

  // Tab configuration with platform colors
  const tabs = [
    { id: "tasks", label: "Tasks", icon: <FaTasks />, color: "blue", gradient: "from-primary-500 to-primary-600" },
    { id: "team", label: "Team", icon: <FaUsers />, color: "purple", gradient: "from-purple-500 to-purple-600" },
    { id: "resources", label: "Resources", icon: <FaFolder />, color: "green", gradient: "from-green-500 to-green-600" },
    { id: "progress", label: "Progress", icon: <FaChartLine />, color: "yellow", gradient: "from-yellow-500 to-yellow-600" },
  ];

  // Enhanced team members data with skills
  const enhancedTeamMembers = [
    { id: 1, name: "John Doe", role: "Frontend Developer", avatar: "https://ui-avatars.com/api/?name=John+Doe&background=00A8E8&color=fff", status: "online", tasksCompleted: 5, skills: ["React", "TypeScript", "Tailwind"] },
    { id: 2, name: "Jane Smith", role: "Backend Developer", avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=8B5CF6&color=fff", status: "away", tasksCompleted: 3, skills: ["Node.js", "MongoDB", "Express"] },
    { id: 3, name: "Mike Johnson", role: "UI/UX Designer", avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=10B981&color=fff", status: "offline", tasksCompleted: 2, skills: ["Figma", "Adobe XD", "Prototyping"] },
  ];

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/project/getlistproject/${_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [_id]);

  // Real-time task updates
  useEffect(() => {
    if (!_id) return;
    const q = query(
      collection(db, "project_tasks"),
      where("projectId", "==", _id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasks);
    });
    return () => unsubscribe();
  }, [_id]);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/getprojecttask/${_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();
  }, [_id]);

  // Handle notes
  const handleAddNote = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notes/usernotes/${_id}`,
        { note: notes, senderId: user?._id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSavedNotes(res.data.notes || []);
      setNotes("");
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1500);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  // Fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/notes/getusernotes/${_id}?senderId=${user?._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setSavedNotes(res.data.notes || []);
      } catch (err) {
        setSavedNotes([]);
        console.error("Failed to fetch notes:", err);
      }
    };
    if (_id && user?._id) fetchNotes();
  }, [_id, user?._id]);

  // Fetch chat history
  useEffect(() => {
    if (!_id) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/project/chat/${_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        const normalized = (res.data || []).map((msg) => ({
          senderID: msg.senderID || msg.sender || "",
          senderRole: msg.senderRole || (msg.sender === "admin" ? "admin" : "user"),
          senderName: msg.senderName || msg.sender || "User",
          text: msg.text || msg.message || "",
        }));
        setChat(normalized);
      })
      .catch((err) => {
        console.error("Failed to fetch chat history:", err);
        setChat([]);
      });
  }, [_id]);

  // Socket connection
  useEffect(() => {
    if (!_id) return;
    socket.current = io(Socket_URl, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.current.on("connect", () => {
      console.log("✅ Socket connected! ID:", socket.current.id);
    });

    socket.current.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.current.emit("joinRoom", _id);

    socket.current.on("receiveMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [_id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Task status update
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/updatedprojecttask/${taskId}`,
        { task_status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Task status updated:", response.data);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Send message
  const sendMessage = () => {
    if (message.trim() && socket.current && user?._id) {
      socket.current.emit("sendMessage", {
        projectId: _id,
        senderId: user._id,
        text: message,
      });
      setMessage("");
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/notes/deleteusernote/${_id}/?senderId=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSavedNotes(res.data.notes || []);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  // Progress calculation
  const doneCount = tasks.filter((t) => t.task_status === "done").length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);



      // Enhanced Modern Task Card Component
      const TaskCard = ({ task, status, color }) => {
        const getPriorityColor = (priority) => {
          switch (priority) {
            case 'high': return 'from-red-500 to-red-600';
            case 'medium': return 'from-yellow-500 to-yellow-600';
            case 'low': return 'from-green-500 to-green-600';
            default: return 'from-gray-500 to-gray-600';
          }
        };

        const getStatusIcon = (status) => {
          switch (status) {
            case 'todo': return <FaRegStickyNote className="w-4 h-4" />;
            case 'inprogress': return <FaEdit className="w-4 h-4" />;
            case 'done': return <FaCheck className="w-4 h-4" />;
            default: return <FaRegStickyNote className="w-4 h-4" />;
          }
        };

        const getStatusGradient = (status) => {
          switch (status) {
            case 'todo': return 'from-[#00A8E8]/20 to-[#0062E6]/20';
            case 'inprogress': return 'from-purple-500/20 to-purple-600/20';
            case 'done': return 'from-green-500/20 to-green-600/20';
            default: return 'from-gray-500/20 to-gray-600/20';
          }
        };

        return (
          <motion.div 
            className="group relative bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-5 border border-[#00A8E8]/20 transition-all duration-500 hover:border-[#00A8E8]/40 hover:shadow-[0_20px_40px_rgba(0,168,232,0.1)] hover:scale-[1.02] overflow-hidden"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00A8E8]/5 via-transparent to-[#0062E6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"></div>
            
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getPriorityColor(task.priority || 'medium')} rounded-t-2xl`}></div>
            
            <div className="relative z-10">
              {/* Header with status and actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${getStatusGradient(status)} border border-[#00A8E8]/20 group-hover:border-[#00A8E8]/30 transition-all duration-300`}>
                    <div className={`${
                      status === "todo" ? "text-[#00A8E8]" : 
                      status === "inprogress" ? "text-purple-400" : 
                      "text-green-400"
                    }`}>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm mb-1 truncate group-hover:text-[#00A8E8] transition-colors duration-300">
                      {task.task_title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {task.priority || 'medium'} priority
                      </span>
                      <span className="text-gray-400 text-xs">#{task._id?.slice(-6)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {status === "todo" && (
                    <button
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-[0_8px_25px_rgba(245,158,11,0.3)] transform hover:scale-105 border border-yellow-500/20 group/btn flex items-center gap-2"
                      onClick={() => updateTaskStatus(task._id, "inprogress")}
                    >
                      <FaRocket className="w-3 h-3 group-hover/btn:rotate-12 transition-transform duration-300" />
                      Start
                    </button>
                  )}
                  {status === "inprogress" && (
                    <button
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-[0_8px_25px_rgba(34,197,94,0.3)] transform hover:scale-105 border border-green-500/20 group/btn flex items-center gap-2"
                      onClick={() => updateTaskStatus(task._id, "done")}
                    >
                      <FaCheck className="w-3 h-3 group-hover/btn:scale-110 transition-transform duration-300" />
                      Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 font-normal">
                  {task.task_description || "No description provided"}
                </p>
              </div>

              {/* Task metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#1E1E1E]/50 px-3 py-1.5 rounded-lg border border-[#00A8E8]/20 group-hover:border-[#00A8E8]/30 transition-all duration-300">
                    <FaClock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 text-xs font-medium">
                      {status === "done" ? "Completed" : status === "inprogress" ? "In Progress" : "To Do"}
                    </span>
                  </div>
                  {task.assignedTo && (
                    <div className="flex items-center gap-1 bg-[#1E1E1E]/50 px-3 py-1.5 rounded-lg border border-[#00A8E8]/20 group-hover:border-[#00A8E8]/30 transition-all duration-300">
                      <FaUserCircle className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-xs font-medium">{task.assignedTo}</span>
                    </div>
                  )}
                </div>
                
                {/* Progress indicator for in-progress tasks */}
                {status === "inprogress" && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[#1E1E1E]/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${task.progress || 50}%` }}></div>
                    </div>
                    <span className="text-gray-400 text-xs font-medium">{task.progress || 50}%</span>
                  </div>
                )}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00A8E8]/0 via-[#00A8E8]/0 to-[#00A8E8]/0 group-hover:from-[#00A8E8]/5 group-hover:via-[#0062E6]/5 group-hover:to-[#00A8E8]/5 transition-all duration-500 rounded-2xl pointer-events-none"></div>
            </div>
          </motion.div>
        );
      };

      // Enhanced Modern Kanban Board Component
      const KanbanBoard = () => {
        const columns = [
          { 
            status: "todo", 
            title: "To Do", 
            icon: <FaRegStickyNote />, 
            color: "blue", 
            gradient: "from-[#00A8E8] to-[#0062E6]",
            count: tasks.filter(t => t.task_status === "todo").length,
            description: "Tasks waiting to be started"
          },
          { 
            status: "inprogress", 
            title: "In Progress", 
            icon: <FaEdit />, 
            color: "purple", 
            gradient: "from-purple-500 to-purple-600",
            count: tasks.filter(t => t.task_status === "inprogress").length,
            description: "Tasks currently being worked on"
          },
          { 
            status: "done", 
            title: "Completed", 
            icon: <FaCheck />, 
            color: "green", 
            gradient: "from-green-500 to-green-600",
            count: tasks.filter(t => t.task_status === "done").length,
            description: "Successfully completed tasks"
          }
        ];

        return (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Enhanced Header */}
            <motion.div 
              className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#00A8E8]/20 to-[#0062E6]/20 rounded-xl border border-[#00A8E8]/20">
                    <FaTasks className="text-[#00A8E8] text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Task Management</h2>
                    <p className="text-gray-400 text-sm">Organize and track your project tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalCount}</div>
                    <div className="text-gray-400 text-xs">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{doneCount}</div>
                    <div className="text-gray-400 text-xs">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00A8E8]">{progress}%</div>
                    <div className="text-gray-400 text-xs">Progress</div>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="bg-[#1E1E1E]/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#00A8E8] via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </motion.div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {columns.map((column, index) => (
                <motion.div 
                  key={column.status} 
                  className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm hover:shadow-[0_20px_40px_rgba(0,168,232,0.1)] transition-all duration-500 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${column.gradient}/20 border border-[#00A8E8]/20 group-hover:border-[#00A8E8]/30 transition-all duration-300 shadow-lg`}>
                        <div className={`text-2xl ${
                          column.color === "blue" ? "text-[#00A8E8]" : 
                          column.color === "purple" ? "text-purple-400" : 
                          "text-green-400"
                        }`}>
                          {column.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-xl mb-1">{column.title}</h3>
                        <p className="text-gray-400 text-sm">{column.description}</p>
                        <div className="w-8 h-1 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full mt-2"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] text-white text-sm px-4 py-2 rounded-xl font-bold shadow-lg border border-[#00A8E8]/20 min-w-[50px] text-center">
                      {column.count}
                    </div>
                  </div>

                  {/* Tasks Container */}
                  <div className="space-y-4 min-h-[400px]">
                    {tasks.filter(t => t.task_status === column.status).length === 0 ? (
                      <div className="text-gray-400 text-center py-16 bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl border border-dashed border-[#00A8E8]/20 hover:border-[#00A8E8]/40 transition-all duration-300 group/empty">
                        <div className="text-4xl mb-4 opacity-20 group-hover/empty:opacity-40 transition-opacity duration-300">
                          {column.status === "todo" ? <FaRegStickyNote /> : 
                           column.status === "inprogress" ? <FaEdit /> : 
                           <FaCheck />}
                        </div>
                        <div className="text-lg font-semibold text-gray-300 mb-2">
                          {column.status === "todo" ? "No tasks to do" : 
                           column.status === "inprogress" ? "No tasks in progress" : 
                           "No completed tasks"}
                        </div>
                        <div className="text-sm opacity-60">Add new tasks to get started</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tasks
                          .filter(t => t.task_status === column.status)
                          .map((task) => (
                            <TaskCard key={task._id} task={task} status={column.status} color={column.color} />
                          ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      };

    // Modern Team Members Component
    const TeamMembers = () => (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#00A8E8]/20 to-[#0062E6]/20 rounded-xl">
                <FaUsers className="text-[#00A8E8] text-xl" />
              </div>
              Team Members ({enhancedTeamMembers.length})
            </h3>
            <div className="w-8 h-0.5 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enhancedTeamMembers.map((member, index) => (
              <motion.div 
                key={member.id} 
                className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 border border-[#00A8E8]/20 shadow-lg hover:shadow-[0_10px_25px_rgba(0,168,232,0.1)] transition-all duration-300 hover:border-[#00A8E8]/40 hover:scale-[1.01] group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1E1E1E] shadow-md ${
                      member.status === "online" ? "bg-gradient-to-r from-green-500 to-green-600 animate-pulse" : 
                      member.status === "away" ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : "bg-gradient-to-r from-gray-500 to-gray-600"
                    }`}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">{member.name}</h4>
                    <p className="text-gray-400 text-xs font-medium">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs bg-[#1E1E1E]/50 px-3 py-2 rounded-lg">
                  <span className="text-gray-400 font-medium">Tasks completed</span>
                  <span className="text-white font-bold text-lg">{member.tasksCompleted}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Modern Chat Section */}
        <motion.div 
          className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#00A8E8]/20 to-[#0062E6]/20 rounded-xl">
                <FaComments className="text-[#00A8E8] text-xl" />
              </div>
              Team Chat
            </h3>
            <div className="w-8 h-0.5 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full"></div>
          </div>
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 h-[400px] flex flex-col border border-[#00A8E8]/20 shadow-lg">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-[#00A8E8] scrollbar-track-transparent">
              {chat.map((msg, idx) => {
                const isMe = user && msg.senderID === user._id;
                const isAdmin = msg.senderRole === "admin";
                const bubbleColor = isAdmin ? "bg-gradient-to-r from-green-600 to-green-700" : isMe ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6]" : "bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A]";
                const alignment = isMe ? "justify-end" : "justify-start";
                
                return (
                  <motion.div 
                    key={idx} 
                    className={`flex ${alignment}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`max-w-[70%] ${bubbleColor} text-white px-4 py-2 rounded-xl shadow-md border border-white/10 hover:shadow-lg transition-all duration-300`}>
                      <div className="text-xs opacity-75 mb-1 font-semibold">
                        {isMe ? "You" : msg.senderName || "User"}
                      </div>
                      <div className="text-xs leading-relaxed">{msg.text}</div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
              <input
                className="flex-1 bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] text-white border border-[#00A8E8]/20 rounded-lg px-4 py-2 focus:outline-none focus:border-[#00A8E8] focus:shadow-[0_0_15px_rgba(0,168,232,0.15)] transition-all duration-300 text-sm"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0062E6] hover:to-[#00A8E8] text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-[0_5px_15px_rgba(0,168,232,0.2)] transform hover:scale-105 border border-[#00A8E8]/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                disabled={!message.trim()}
              >
                <FaPaperPlane className="text-sm group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );

  // Modern Resources Component
  const Resources = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* GitHub Setup */}
      <motion.div 
        className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#1E1E1E]/20 to-[#2A2A2A]/20 rounded-xl">
            <FaGithub className="text-xl text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">GitHub Repository</h3>
        </div>
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 border border-[#00A8E8]/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Repository</span>
            <a
              href={project?.project?.Project_gitHub_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00A8E8] hover:text-[#0062E6] text-xs flex items-center gap-2 transition-colors duration-300 group"
            >
              <FaExternalLinkAlt className="group-hover:translate-x-1 transition-transform duration-300" />
              Open Repository
            </a>
          </div>
          <div className="bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] rounded-lg p-3 font-mono text-xs text-gray-300 mb-3 border border-[#00A8E8]/20">
            git clone {project?.project?.Project_gitHub_link}
          </div>
          <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-[0_5px_15px_rgba(34,197,94,0.2)] transform hover:scale-105 border border-green-500/20 group">
            <FaCopy className="group-hover:rotate-12 transition-transform duration-300" />
            Copy Command
          </button>
        </div>
      </motion.div>

      {/* Setup Guide */}
      <motion.div 
        className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#00A8E8]/20 to-[#0062E6]/20 rounded-xl">
            <FaRocket className="text-[#00A8E8] text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">Quick Setup Guide</h3>
        </div>
        <div className="space-y-3">
          {[
            { step: 1, title: "Clone Repository", command: "git clone [repo-url]", icon: <FaGithub /> },
            { step: 2, title: "Install Dependencies", command: "npm install", icon: <FaDownload /> },
            { step: 3, title: "Start Development", command: "npm run dev", icon: <FaRocket /> },
            { step: 4, title: "Create Branch", command: "git checkout -b feature/[name]", icon: <FaCode /> }
          ].map((item, index) => (
            <motion.div 
              key={item.step} 
              className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-3 flex items-center gap-3 border border-[#00A8E8]/20 hover:border-[#00A8E8]/40 transition-all duration-300 hover:scale-[1.01] group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="w-6 h-6 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                {item.step}
              </div>
              <div className="p-1.5 bg-gradient-to-br from-[#00A8E8]/20 to-[#0062E6]/20 rounded-lg">
                <div className="text-[#00A8E8] text-sm">{item.icon}</div>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-semibold mb-0.5">{item.title}</div>
                <div className="text-gray-400 text-xs font-mono bg-[#1E1E1E]/50 px-2 py-1 rounded-md">{item.command}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Documentation */}
      <motion.div 
        className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
            <FaFile className="text-purple-400 text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">Documentation & Resources</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Project README", icon: <FaFile />, color: "[#00A8E8]", gradient: "from-[#00A8E8] to-[#0062E6]" },
            { title: "API Documentation", icon: <FaCode />, color: "green", gradient: "from-green-500 to-green-600" },
            { title: "Design System", icon: <FaImage />, color: "purple", gradient: "from-purple-500 to-purple-600" },
            { title: "Video Tutorials", icon: <FaVideo />, color: "red", gradient: "from-red-500 to-red-600" }
          ].map((doc, idx) => (
            <motion.div 
              key={idx} 
              className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 border border-[#00A8E8]/20 hover:border-[#00A8E8]/40 transition-all duration-300 cursor-pointer group hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(0,168,232,0.1)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${doc.gradient}/20 rounded-lg`}>
                  <div className={`text-${doc.color}-400 text-lg`}>{doc.icon}</div>
                </div>
                <span className="text-white font-semibold text-sm">{doc.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  // Modern Progress Component
  const Progress = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Overall Progress */}
      <motion.div 
        className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#00A8E8]/20 to-[#0062E6]/20 rounded-xl">
            <FaChartLine className="text-[#00A8E8] text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">Project Progress</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div 
            className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 text-center border border-[#00A8E8]/20 hover:border-[#00A8E8]/40 transition-all duration-300 hover:scale-105 group"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-2xl font-bold text-white mb-1 group-hover:text-[#00A8E8] transition-colors duration-300">{totalCount}</div>
            <div className="text-gray-400 text-xs font-medium">Total Tasks</div>
            <div className="w-6 h-0.5 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full mt-3 mx-auto"></div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 text-center border border-[#00A8E8]/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 group"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-2xl font-bold text-green-400 mb-1">{doneCount}</div>
            <div className="text-gray-400 text-xs font-medium">Completed</div>
            <div className="w-6 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-3 mx-auto"></div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 text-center border border-[#00A8E8]/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 group"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-2xl font-bold text-[#00A8E8] mb-1">{progress}%</div>
            <div className="text-gray-400 text-xs font-medium">Progress</div>
            <div className="w-6 h-0.5 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full mt-3 mx-auto"></div>
          </motion.div>
        </div>
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 border border-[#00A8E8]/20">
          <div className="flex justify-between text-xs text-gray-400 mb-3 font-medium">
            <span>Overall Progress</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-[#1E1E1E]/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00A8E8] via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-md"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

      {/* Personal Progress */}
      <motion.div 
        className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-6 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl">
            <FaUserCircle className="text-green-400 text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">My Progress</h3>
        </div>
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 border border-[#00A8E8]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                alt="Profile"
                className="w-12 h-12 rounded-xl shadow-md border-2 border-[#00A8E8]/20"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full border-2 border-white shadow-md animate-pulse"></div>
            </div>
            <div>
              <div className="text-white font-bold text-sm">{user?.name || 'Contributor'}</div>
              <div className="text-gray-400 text-xs font-medium">Active Contributor</div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="space-y-3">
            <label className="text-gray-400 text-xs font-medium block">Add Note</label>
            <textarea
              className="w-full bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] text-white border border-[#00A8E8]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#00A8E8] focus:shadow-[0_0_15px_rgba(0,168,232,0.15)] transition-all duration-300 resize-none text-sm"
              rows={3}
              placeholder="Share your progress or blockers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                disabled={!notes.trim()}
                className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0062E6] hover:to-[#00A8E8] text-white px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-[0_5px_15px_rgba(0,168,232,0.2)] transform hover:scale-105 border border-[#00A8E8]/20 group"
              >
                <FaPaperPlane className="text-xs group-hover:rotate-12 transition-transform duration-300" />
                Add Note
              </button>
              <button
                onClick={handleDeleteNote}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-[0_5px_15px_rgba(239,68,68,0.2)] transform hover:scale-105 border border-red-500/20 group"
              >
                <IoTrashBin className="text-xs group-hover:rotate-12 transition-transform duration-300" />
                Clear
              </button>
            </div>
            {noteSaved && (
              <div className="text-green-400 text-xs font-medium bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                ✓ Note saved successfully!
              </div>
            )}
          </div>

          {/* Saved Notes */}
          {savedNotes.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <FaRegStickyNote className="text-[#00A8E8]" />
                My Notes
              </h4>
              <div className="space-y-2">
                {savedNotes.map((note, idx) => (
                  <motion.div 
                    key={idx} 
                    className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg p-3 border border-[#00A8E8]/20 hover:border-[#00A8E8]/40 transition-all duration-300 hover:scale-[1.01]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                  >
                    <div className="text-[#00A8E8] text-xs font-semibold mb-1 bg-[#00A8E8]/10 px-2 py-0.5 rounded-md inline-block">Note {idx + 1}</div>
                    <div className="text-white text-xs leading-relaxed">{note.text}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <div className="text-white">Loading project...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <Navbar />
      
      {/* Modern & Sophisticated Header */}
      <motion.header 
        className="relative bg-gradient-to-br from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] mt-[6vmin] border-b border-[#00A8E8]/20 px-6 md:px-8 py-8 overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-full blur-2xl"></div>
          <div className="absolute top-16 right-16 w-80 h-80 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Project Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-2xl flex items-center justify-center shadow-xl border border-[#00A8E8]/20 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(0,168,232,0.2)]">
                    <FaProjectDiagram className="text-white text-2xl" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md border border-green-500/20 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      Active Project
                    </span>
                    <span className="text-gray-400 text-sm font-medium">• {project?.project?.Project_tech_stack}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
                    {project?.project?.project_Title}
                  </h1>
                  <p className="text-gray-300 text-base leading-relaxed max-w-4xl font-light">
                    {project?.project?.Project_Description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modern Stats Cards */}
            <div className="flex flex-wrap gap-3">
              <motion.div 
                className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-4 border border-[#00A8E8]/20 min-w-[120px] shadow-xl backdrop-blur-sm hover:shadow-[0_10px_25px_rgba(0,168,232,0.1)] transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-2xl font-bold text-white mb-1">{enhancedTeamMembers.length}</div>
                <div className="text-gray-400 text-xs font-medium">Team Members</div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full mt-3"></div>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-4 border border-[#00A8E8]/20 min-w-[120px] shadow-xl backdrop-blur-sm hover:shadow-[0_10px_25px_rgba(0,168,232,0.1)] transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-2xl font-bold text-green-400 mb-1">{progress}%</div>
                <div className="text-gray-400 text-xs font-medium">Progress</div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-3"></div>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-4 border border-[#00A8E8]/20 min-w-[120px] shadow-xl backdrop-blur-sm hover:shadow-[0_10px_25px_rgba(0,168,232,0.1)] transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-2xl font-bold text-[#00A8E8] mb-1">{totalCount}</div>
                <div className="text-gray-400 text-xs font-medium">Tasks</div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full mt-3"></div>
              </motion.div>
            </div>
          </div>
          
          {/* Modern Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[#00A8E8]/20">
            <motion.a
              href={project?.project?.Project_gitHub_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0062E6] hover:to-[#00A8E8] text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-[0_10px_25px_rgba(0,168,232,0.2)] transform hover:scale-105 border border-[#00A8E8]/20 group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <FaGithub className="text-base group-hover:rotate-12 transition-transform duration-300" />
              Clone Repository
            </motion.a>
            <motion.button 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-[0_10px_25px_rgba(34,197,94,0.2)] transform hover:scale-105 border border-green-500/20 group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <FaDownload className="text-base group-hover:translate-y-[-1px] transition-transform duration-300" />
              Download Files
            </motion.button>
            <motion.button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-[0_10px_25px_rgba(139,92,246,0.2)] transform hover:scale-105 border border-purple-500/20 group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <FaShare className="text-base group-hover:rotate-12 transition-transform duration-300" />
              Share Project
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Tab Navigation */}
          <motion.div 
            className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl p-3 mb-8 border border-[#00A8E8]/20 shadow-xl backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 text-sm font-semibold relative overflow-hidden group ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg transform scale-105 border border-[#00A8E8]/20"
                      : "text-gray-400 hover:text-white hover:bg-[#1E1E1E]/50 hover:scale-102 border border-transparent hover:shadow-md"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Active tab indicator */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00A8E8]/20 to-[#0062E6]/20 rounded-xl"></div>
                  )}
                  <div className={`text-lg transition-all duration-300 relative z-10 ${
                    activeTab === tab.id ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'
                  }`}>
                    {tab.icon}
                  </div>
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              className="min-h-[600px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {activeTab === "tasks" && <KanbanBoard />}
              {activeTab === "team" && <TeamMembers />}
              {activeTab === "resources" && <Resources />}
              {activeTab === "progress" && <Progress />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Chat (Fixed Bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#00A8E8]/20 p-2 flex gap-2 z-50">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-[#2A2A2A] text-white border border-[#00A8E8]/20 focus:outline-none text-sm"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-[#00A8E8] hover:bg-[#0062E6] text-white px-3 py-2 rounded-lg transition flex items-center"
          onClick={sendMessage}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ContributionPage;
