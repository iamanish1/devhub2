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

const Socket_URl =
  import.meta.env.VITE_SOCKET_SERVER || `${import.meta.env.VITE_API_URL}`;

// Enhanced mentor data
const mentor = {
  name: "Project Lead",
  avatar: "https://ui-avatars.com/api/?name=Project+Lead&background=3B82F6&color=fff",
  bio: "Senior Developer & Project Lead",
  expertise: "Full Stack, Team Management",
  email: "lead@devhubs.com",
  role: "Project Lead",
  status: "online",
};

const ContributionPage= () => {
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

  // Tab configuration
  const tabs = [
    { id: "tasks", label: "Tasks", icon: <FaTasks />, color: "blue", gradient: "from-blue-500 to-blue-600" },
    { id: "team", label: "Team", icon: <FaUsers />, color: "purple", gradient: "from-purple-500 to-purple-600" },
    { id: "resources", label: "Resources", icon: <FaFolder />, color: "green", gradient: "from-green-500 to-green-600" },
    { id: "progress", label: "Progress", icon: <FaChartLine />, color: "yellow", gradient: "from-yellow-500 to-yellow-600" },
  ];

  // Enhanced team members data with skills
  const enhancedTeamMembers = [
    { id: 1, name: "John Doe", role: "Frontend Developer", avatar: "https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff", status: "online", tasksCompleted: 5, skills: ["React", "TypeScript", "Tailwind"] },
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



                                               // Modern Task Card Component
      const TaskCard = ({ task, status, color }) => (
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-4 border border-[#404040]/50 transition-all duration-300 hover:border-[#3b82f6]/50 hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] group hover:scale-[1.01] relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  color === "blue" ? "bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] shadow-sm shadow-[#3b82f6]/20" : 
                  color === "purple" ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] shadow-sm shadow-[#8b5cf6]/20" : 
                  "bg-gradient-to-r from-[#22c55e] to-[#16a34a] shadow-sm shadow-[#22c55e]/20"
                }`}></div>
                <span className="font-semibold text-white text-sm truncate">{task.task_title}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {status === "todo" && (
                  <button
                    className="text-xs bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#d97706] hover:to-[#b45309] text-white px-3 py-1.5 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 border border-[#f59e0b]/20 group/btn"
                    onClick={() => updateTaskStatus(task._id, "inprogress")}
                  >
                    <FaRocket className="inline mr-1 w-3 h-3 group-hover/btn:rotate-12 transition-transform duration-300" />
                    Start
                  </button>
                )}
                {status === "inprogress" && (
                  <button
                    className="text-xs bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white px-3 py-1.5 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 border border-[#22c55e]/20 group/btn"
                    onClick={() => updateTaskStatus(task._id, "done")}
                  >
                    <FaCheck className="inline mr-1 w-3 h-3 group-hover/btn:scale-110 transition-transform duration-300" />
                    Complete
                  </button>
                )}
              </div>
            </div>
            <p className="text-[#a3a3a3] text-xs mb-3 line-clamp-2 font-normal leading-relaxed">{task.task_description}</p>
            <div className="flex items-center justify-between text-xs text-[#6b7280]">
              <span className="font-medium bg-[#404040]/20 px-2 py-1 rounded-md">#{task._id?.slice(-4)}</span>
              <span className="flex items-center gap-1 bg-[#404040]/20 px-2 py-1 rounded-md">
                <FaClock className="w-2.5 h-2.5" />
                {status === "done" ? "Completed" : status === "inprogress" ? "In Progress" : "To Do"}
              </span>
            </div>
          </div>
        </div>
      );

                                               // Modern Kanban Board Component
      const KanbanBoard = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { status: "todo", title: "To Do", icon: <FaRegStickyNote />, color: "blue", count: tasks.filter(t => t.task_status === "todo").length },
            { status: "inprogress", title: "In Progress", icon: <FaEdit />, color: "purple", count: tasks.filter(t => t.task_status === "inprogress").length },
            { status: "done", title: "Completed", icon: <FaCheck />, color: "green", count: tasks.filter(t => t.task_status === "done").length }
          ].map((column) => (
            <div key={column.status} className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    column.color === "blue" ? "bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/20 text-[#3b82f6]" : 
                    column.color === "purple" ? "bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/20 text-[#8b5cf6]" : 
                    "bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 text-[#22c55e]"
                  } shadow-md`}>
                    <span className="text-xl">{column.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{column.title}</h3>
                    <div className="w-6 h-0.5 bg-gradient-to-r from-[#404040] to-[#525252] rounded-full"></div>
                  </div>
                </div>
                <span className="bg-gradient-to-r from-[#404040] to-[#525252] text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-md border border-[#525252]/20 min-w-[40px] text-center">
                  {column.count}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.task_status === column.status).length === 0 ? (
                  <div className="text-[#6b7280] text-xs text-center py-12 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl border border-dashed border-[#404040]/30 hover:border-[#404040]/50 transition-all duration-300">
                    <div className="text-3xl mb-3 opacity-20">
                      {column.status === "todo" ? <FaRegStickyNote /> : 
                       column.status === "inprogress" ? <FaEdit /> : 
                       <FaCheck />}
                    </div>
                    <div className="text-sm font-medium text-[#a3a3a3]">
                      {column.status === "todo" ? "No tasks to do" : 
                       column.status === "inprogress" ? "No tasks in progress" : 
                       "No completed tasks"}
                    </div>
                    <div className="text-xs opacity-40 mt-1">Add new tasks to get started</div>
                  </div>
                ) : (
                  tasks
                    .filter(t => t.task_status === column.status)
                    .map((task) => (
                      <TaskCard key={task._id} task={task} status={column.status} color={column.color} />
                    ))
                )}
              </div>
            </div>
          ))}
        </div>
      );

           // Modern Team Members Component
    const TeamMembers = () => (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/20 rounded-xl">
                <FaUsers className="text-[#3b82f6] text-xl" />
              </div>
              Team Members ({enhancedTeamMembers.length})
            </h3>
            <div className="w-8 h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enhancedTeamMembers.map((member) => (
              <div key={member.id} className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 border border-[#404040]/50 shadow-lg hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-[#3b82f6]/30 hover:scale-[1.01] group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a] shadow-md ${
                      member.status === "online" ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a] animate-pulse" : 
                      member.status === "away" ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706]" : "bg-gradient-to-r from-[#6b7280] to-[#4b5563]"
                    }`}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">{member.name}</h4>
                    <p className="text-[#a3a3a3] text-xs font-medium">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs bg-[#404040]/20 px-3 py-2 rounded-lg">
                  <span className="text-[#a3a3a3] font-medium">Tasks completed</span>
                  <span className="text-white font-bold text-lg">{member.tasksCompleted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Modern Chat Section */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/20 rounded-xl">
                <FaComments className="text-[#3b82f6] text-xl" />
              </div>
              Team Chat
            </h3>
            <div className="w-8 h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-full"></div>
          </div>
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 h-[400px] flex flex-col border border-[#404040]/50 shadow-lg">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-[#404040] scrollbar-track-transparent">
              {chat.map((msg, idx) => {
                const isMe = user && msg.senderID === user._id;
                const isAdmin = msg.senderRole === "admin";
                const bubbleColor = isAdmin ? "bg-gradient-to-r from-[#065f46] to-[#047857]" : isMe ? "bg-gradient-to-r from-[#1e40af] to-[#1d4ed8]" : "bg-gradient-to-r from-[#404040] to-[#525252]";
                const alignment = isMe ? "justify-end" : "justify-start";
                
                return (
                  <div key={idx} className={`flex ${alignment}`}>
                    <div className={`max-w-[70%] ${bubbleColor} text-white px-4 py-2 rounded-xl shadow-md border border-white/10 hover:shadow-lg transition-all duration-300`}>
                      <div className="text-xs opacity-75 mb-1 font-semibold">
                        {isMe ? "You" : msg.senderName || "User"}
                      </div>
                      <div className="text-xs leading-relaxed">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
              <input
                className="flex-1 bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white border border-[#404040]/50 rounded-lg px-4 py-2 focus:outline-none focus:border-[#3b82f6] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 text-sm"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-[0_5px_15px_rgba(37,99,235,0.2)] transform hover:scale-105 border border-[#3b82f6]/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                disabled={!message.trim()}
              >
                <FaPaperPlane className="text-sm group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );

  // Modern Resources Component
  const Resources = () => (
    <div className="space-y-6">
      {/* GitHub Setup */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#333]/20 to-[#444]/20 rounded-xl">
            <FaGithub className="text-xl text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">GitHub Repository</h3>
        </div>
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 border border-[#404040]/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Repository</span>
            <a
              href={project?.project?.Project_gitHub_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3b82f6] hover:text-[#60a5fa] text-xs flex items-center gap-2 transition-colors duration-300 group"
            >
              <FaExternalLinkAlt className="group-hover:translate-x-1 transition-transform duration-300" />
              Open Repository
            </a>
          </div>
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] rounded-lg p-3 font-mono text-xs text-gray-300 mb-3 border border-[#404040]/50">
            git clone {project?.project?.Project_gitHub_link}
          </div>
          <button className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-[0_5px_15px_rgba(34,197,94,0.2)] transform hover:scale-105 border border-[#22c55e]/20 group">
            <FaCopy className="group-hover:rotate-12 transition-transform duration-300" />
            Copy Command
          </button>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/20 rounded-xl">
            <FaRocket className="text-[#3b82f6] text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">Quick Setup Guide</h3>
        </div>
        <div className="space-y-3">
          {[
            { step: 1, title: "Clone Repository", command: "git clone [repo-url]", icon: <FaGithub /> },
            { step: 2, title: "Install Dependencies", command: "npm install", icon: <FaDownload /> },
            { step: 3, title: "Start Development", command: "npm run dev", icon: <FaRocket /> },
            { step: 4, title: "Create Branch", command: "git checkout -b feature/[name]", icon: <FaCode /> }
          ].map((item) => (
            <div key={item.step} className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-3 flex items-center gap-3 border border-[#404040]/50 hover:border-[#3b82f6]/30 transition-all duration-300 hover:scale-[1.01] group">
              <div className="w-6 h-6 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                {item.step}
              </div>
              <div className="p-1.5 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/20 rounded-lg">
                <div className="text-[#3b82f6] text-sm">{item.icon}</div>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-semibold mb-0.5">{item.title}</div>
                <div className="text-gray-400 text-xs font-mono bg-[#404040]/30 px-2 py-1 rounded-md">{item.command}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/20 rounded-xl">
            <FaFile className="text-[#8b5cf6] text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">Documentation & Resources</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Project README", icon: <FaFile />, color: "blue", gradient: "from-[#3b82f6] to-[#1d4ed8]" },
            { title: "API Documentation", icon: <FaCode />, color: "green", gradient: "from-[#22c55e] to-[#16a34a]" },
            { title: "Design System", icon: <FaImage />, color: "purple", gradient: "from-[#8b5cf6] to-[#7c3aed]" },
            { title: "Video Tutorials", icon: <FaVideo />, color: "red", gradient: "from-[#ef4444] to-[#dc2626]" }
          ].map((doc, idx) => (
            <div key={idx} className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 border border-[#404040]/50 hover:border-[#3b82f6]/30 transition-all duration-300 cursor-pointer group hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${doc.gradient}/20 rounded-lg`}>
                  <div className={`text-${doc.color}-400 text-lg`}>{doc.icon}</div>
                </div>
                <span className="text-white font-semibold text-sm">{doc.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Modern Progress Component
  const Progress = () => (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/20 rounded-xl">
            <FaChartLine className="text-[#3b82f6] text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">Project Progress</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 text-center border border-[#404040]/50 hover:border-[#3b82f6]/30 transition-all duration-300 hover:scale-105 group">
            <div className="text-2xl font-bold text-white mb-1 group-hover:text-[#3b82f6] transition-colors duration-300">{totalCount}</div>
            <div className="text-[#a3a3a3] text-xs font-medium">Total Tasks</div>
            <div className="w-6 h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-full mt-3 mx-auto"></div>
          </div>
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 text-center border border-[#404040]/50 hover:border-[#22c55e]/30 transition-all duration-300 hover:scale-105 group">
            <div className="text-2xl font-bold text-[#22c55e] mb-1">{doneCount}</div>
            <div className="text-[#a3a3a3] text-xs font-medium">Completed</div>
            <div className="w-6 h-0.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full mt-3 mx-auto"></div>
          </div>
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 text-center border border-[#404040]/50 hover:border-[#8b5cf6]/30 transition-all duration-300 hover:scale-105 group">
            <div className="text-2xl font-bold text-[#8b5cf6] mb-1">{progress}%</div>
            <div className="text-[#a3a3a3] text-xs font-medium">Progress</div>
            <div className="w-6 h-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full mt-3 mx-auto"></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 border border-[#404040]/50">
          <div className="flex justify-between text-xs text-[#a3a3a3] mb-3 font-medium">
            <span>Overall Progress</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-[#404040]/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#22c55e] h-3 rounded-full transition-all duration-1000 ease-out shadow-md"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Personal Progress */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-6 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 rounded-xl">
            <FaUserCircle className="text-[#22c55e] text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white">My Progress</h3>
        </div>
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-4 border border-[#404040]/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                alt="Profile"
                className="w-12 h-12 rounded-xl shadow-md border-2 border-[#404040]/50"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full border-2 border-white shadow-md animate-pulse"></div>
            </div>
            <div>
              <div className="text-white font-bold text-sm">{user?.name || 'Contributor'}</div>
              <div className="text-[#a3a3a3] text-xs font-medium">Active Contributor</div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="space-y-3">
            <label className="text-[#a3a3a3] text-xs font-medium block">Add Note</label>
            <textarea
              className="w-full bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white border border-[#404040]/50 rounded-lg px-3 py-2 focus:outline-none focus:border-[#3b82f6] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 resize-none text-sm"
              rows={3}
              placeholder="Share your progress or blockers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                disabled={!notes.trim()}
                className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-[0_5px_15px_rgba(59,130,246,0.2)] transform hover:scale-105 border border-[#3b82f6]/20 group"
              >
                <FaPaperPlane className="text-xs group-hover:rotate-12 transition-transform duration-300" />
                Add Note
              </button>
              <button
                onClick={handleDeleteNote}
                className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-[0_5px_15px_rgba(239,68,68,0.2)] transform hover:scale-105 border border-[#ef4444]/20 group"
              >
                <IoTrashBin className="text-xs group-hover:rotate-12 transition-transform duration-300" />
                Clear
              </button>
            </div>
            {noteSaved && (
              <div className="text-[#22c55e] text-xs font-medium bg-[#22c55e]/10 px-3 py-2 rounded-lg border border-[#22c55e]/20">
                ✓ Note saved successfully!
              </div>
            )}
          </div>

          {/* Saved Notes */}
          {savedNotes.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <FaRegStickyNote className="text-[#3b82f6]" />
                My Notes
              </h4>
              <div className="space-y-2">
                {savedNotes.map((note, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-lg p-3 border border-[#404040]/50 hover:border-[#3b82f6]/30 transition-all duration-300 hover:scale-[1.01]">
                    <div className="text-[#3b82f6] text-xs font-semibold mb-1 bg-[#3b82f6]/10 px-2 py-0.5 rounded-md inline-block">Note {idx + 1}</div>
                    <div className="text-white text-xs leading-relaxed">{note.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] flex flex-col">
      <Navbar />
      
             {/* Modern & Sophisticated Header */}
       <header className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#2d2d2d] mt-[6vmin] border-b border-[#404040]/50 px-6 md:px-8 py-8 overflow-hidden">
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-3">
           <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-full blur-2xl"></div>
           <div className="absolute top-16 right-16 w-80 h-80 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-full blur-2xl"></div>
         </div>
         
         <div className="relative max-w-7xl mx-auto">
           <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
             {/* Project Info */}
             <div className="flex-1">
               <div className="flex items-start gap-4 mb-6">
                 <div className="relative group">
                   <div className="w-16 h-16 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-2xl flex items-center justify-center shadow-xl border border-[#3b82f6]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                     <FaProjectDiagram className="text-white text-2xl" />
                   </div>
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full border-2 border-white shadow-md animate-pulse"></div>
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-3">
                     <span className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md border border-[#22c55e]/20 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                       Active Project
                     </span>
                     <span className="text-[#a3a3a3] text-sm font-medium">• {project?.project?.Project_tech_stack}</span>
                   </div>
                   <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
                     {project?.project?.project_Title}
                   </h1>
                   <p className="text-[#d4d4d4] text-base leading-relaxed max-w-4xl font-light">
                     {project?.project?.Project_Description}
                   </p>
                 </div>
               </div>
             </div>
             
             {/* Modern Stats Cards */}
             <div className="flex flex-wrap gap-3">
               <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-4 border border-[#475569]/50 min-w-[120px] shadow-xl backdrop-blur-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105">
                 <div className="text-2xl font-bold text-white mb-1">{enhancedTeamMembers.length}</div>
                 <div className="text-[#94a3b8] text-xs font-medium">Team Members</div>
                 <div className="w-8 h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-full mt-3"></div>
               </div>
               <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-4 border border-[#475569]/50 min-w-[120px] shadow-xl backdrop-blur-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105">
                 <div className="text-2xl font-bold text-[#22c55e] mb-1">{progress}%</div>
                 <div className="text-[#94a3b8] text-xs font-medium">Progress</div>
                 <div className="w-8 h-0.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full mt-3"></div>
               </div>
               <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-4 border border-[#475569]/50 min-w-[120px] shadow-xl backdrop-blur-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105">
                 <div className="text-2xl font-bold text-[#8b5cf6] mb-1">{totalCount}</div>
                 <div className="text-[#94a3b8] text-xs font-medium">Tasks</div>
                 <div className="w-8 h-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full mt-3"></div>
               </div>
             </div>
           </div>
           
           {/* Modern Action Buttons */}
           <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[#404040]/50">
             <a
               href={project?.project?.Project_gitHub_link}
               target="_blank"
               rel="noopener noreferrer"
               className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-[0_10px_25px_rgba(37,99,235,0.2)] transform hover:scale-105 border border-[#3b82f6]/20 group"
             >
               <FaGithub className="text-base group-hover:rotate-12 transition-transform duration-300" />
               Clone Repository
             </a>
             <button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-[0_10px_25px_rgba(5,150,105,0.2)] transform hover:scale-105 border border-[#10b981]/20 group">
               <FaDownload className="text-base group-hover:translate-y-[-1px] transition-transform duration-300" />
               Download Files
             </button>
             <button className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-[0_10px_25px_rgba(124,58,237,0.2)] transform hover:scale-105 border border-[#8b5cf6]/20 group">
               <FaShare className="text-base group-hover:rotate-12 transition-transform duration-300" />
               Share Project
             </button>
           </div>
         </div>
       </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
                     {/* Modern Tab Navigation */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-2xl p-3 mb-8 border border-[#404040]/50 shadow-xl backdrop-blur-sm">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 text-sm font-semibold relative overflow-hidden group ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-lg transform scale-105 border border-[#3b82f6]/20"
                      : "text-[#a3a3a3] hover:text-white hover:bg-[#404040]/50 hover:scale-102 border border-transparent hover:shadow-md"
                  }`}
                >
                  {/* Active tab indicator */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/20 to-[#1d4ed8]/20 rounded-xl"></div>
                  )}
                  <div className={`text-lg transition-all duration-300 relative z-10 ${
                    activeTab === tab.id ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'
                  }`}>
                    {tab.icon}
                  </div>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === "tasks" && <KanbanBoard />}
            {activeTab === "team" && <TeamMembers />}
            {activeTab === "resources" && <Resources />}
            {activeTab === "progress" && <Progress />}
          </div>
        </div>
      </main>

      {/* Mobile Chat (Fixed Bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#232a34] border-t border-blue-500/10 p-2 flex gap-2 z-50">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition flex items-center"
          onClick={sendMessage}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ContributionPage;
