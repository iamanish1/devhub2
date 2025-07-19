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
} from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../Config/firebase";
import io from "socket.io-client";

import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Socket_URl =
  import.meta.env.VITE_SOCKET_SERVER || "http://localhost:8000";
console.log("Socket URL:", Socket_URl);

// Dummy data
const tasksMock = [
  {
    id: 1,
    title: "Setup project locally",
    desc: "Clone and run the repo",
    status: "todo",
  },
  {
    id: 2,
    title: "Fix login bug",
    desc: "Resolve login API error",
    status: "inprogress",
  },
  {
    id: 3,
    title: "Write unit tests",
    desc: "Add tests for user module",
    status: "done",
  },
];

const mentor = {
  name: "Jane Doe",
  avatar: "https://ui-avatars.com/api/?name=Jane+Doe",
  bio: "Senior Developer, React & Node.js expert. Here to help you succeed!",
  expertise: "Full Stack, Mentorship",
  email: "jane.doe@devhubs.com",
};

const messagesMock = [
  { sender: "mentor", text: "Welcome! Let me know if you need help." },
  { sender: "owner", text: "Hi! Please update your progress here." },
  { sender: "me", text: "Thanks! Starting with setup." },
];

const ContributionPage = () => {
  const [tasks, setTasks] = useState(tasksMock);
  const [chat, setChat] = useState(messagesMock);
  const [project, setProject] = useState();
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("Excited to contribute!");
  const [descExpanded, setDescExpanded] = useState(false);
  const chatEndRef = useRef(null);
  const socket = useRef(null);
  const { user } = useAuth();

  const { _id } = useParams();

  //  Fetaching project by id

  useEffect(() => {
    const fetchproject = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/project/getlistproject/${_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Fetched project by id :", response.data);
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project by id :", error);
      }
    };
    fetchproject();
  }, [_id]);

  useEffect(() => {
    if (!_id) return;
    // Listen for real-time updates for tasks of this project
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

  // api for the fetching the  task for the specific project
  useEffect(
    () => {
      const fetchTask = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/admin/getprojecttask/${_id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          console.log("Fetched Tasks by api on user pannel :", response.data);
          setTasks(response.data);
        } catch (error) {
          console.error("Error fetching tasks:", error);
        }
      };
      fetchTask();
    },
    // eslint-disable-next-line
    []
  );

  // Fetch chat history for the selected project
  useEffect(() => {
    if (!_id) return;
    axios
      .get(`http://localhost:8000/api/project/chat/${_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        // Normalize messages to match chat panel expectations
        const normalized = (res.data || []).map((msg) => ({
          senderID: msg.senderID || msg.sender || "",
          senderRole:
            msg.senderRole || (msg.sender === "admin" ? "admin" : "user"),
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
  }, [_id]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Initialize socket connection
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
      console.log("Received message:", msg);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [_id]);

  // Task status update handler
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/admin/updatedprojecttask/${taskId}`,
        { task_status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Task status updated:", response.data);
      setTasks((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Chat send handler
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

  // Progress calculation
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <Navbar />
      {/* Project Overview Header */}
      <header className="bg-[#181b23] mt-[6vmin] border-b border-blue-500/20 px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1 flex items-center gap-2 flex-wrap">
            {project?.project.project_Title}
            <span className="ml-2 text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded-full">
              Open
            </span>
          </h1>
          <div className="text-gray-300 max-w-xl relative text-sm sm:text-base">
            <span>
              {descExpanded
                ? project?.project.Project_Description
                : project?.project.Project_Description
                ? project.project.Project_Description.slice(0, 120) +
                  (project.project.Project_Description.length > 120
                    ? "..."
                    : "")
                : "No description available."}
            </span>
            {project?.project.Project_Description &&
              project.project.Project_Description.length > 120 && (
                <button
                  className="ml-2 text-blue-400 hover:underline text-xs"
                  onClick={() => setDescExpanded((v) => !v)}
                  aria-label={descExpanded ? "Show less" : "Show more"}
                >
                  {descExpanded ? "Show less" : "Show more"}
                </button>
              )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
          <a
            href={project?.project.Project_gitHub_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow transition focus:ring-2 focus:ring-blue-400 text-sm sm:text-base w-full sm:w-auto justify-center"
            title="Clone Project Repo"
          >
            <FaGithub /> Clone Project
          </a>
          <div className="flex items-center gap-2 bg-[#232a34] px-2 sm:px-3 py-2 rounded-lg shadow border border-blue-500/10 w-full sm:w-auto">
            <img
              src={mentor.avatar}
              alt="Owner"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-blue-400"
            />
            <span className="text-white font-semibold truncate">
              {mentor.name}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              (Owner)
            </span>
            <div className="relative group">
              <FaInfoCircle className="text-blue-300 ml-2 cursor-pointer" />
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#232a34] text-xs text-gray-200 rounded-lg shadow-lg p-3 border border-blue-500/20 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition z-20">
                <div className="font-bold text-blue-400 mb-1">
                  {mentor.name}
                </div>
                <div>{mentor.bio}</div>
                <div className="mt-1 text-blue-300">
                  Expertise: {mentor.expertise}
                </div>
                <div className="mt-1 text-blue-200">
                  <a
                    href={`mailto:${mentor.email}`}
                    className="hover:underline"
                  >
                    {mentor.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 p-2 sm:p-4 md:p-8 w-full overflow-x-hidden">
        {/* Kanban Task Board */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Responsive horizontal scroll for Kanban columns on small screens */}
          <div className="flex flex-row md:grid md:grid-cols-3 gap-4 mb-6 w-full min-w-0 overflow-x-auto pb-2">
            {/* TODO */}
            <div className="w-72 md:w-full min-w-[16rem] flex-shrink-0 md:flex-shrink md:min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-blue-300 mb-2 flex items-center gap-1">
                TODO <FaRegStickyNote className="text-blue-400" />
              </h2>
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
                      key={task._id}
                      className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 transition hover:scale-[1.02] hover:border-blue-400"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white flex items-center gap-2">
                          <FaRegStickyNote className="text-blue-400" />{" "}
                          {task.task_title}
                        </span>
                        <button
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition focus:ring-2 focus:ring-yellow-400"
                          onClick={() =>
                            updateTaskStatus(task._id, "inprogress")
                          }
                          title="Mark as In Progress"
                        >
                          Mark In Progress
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">
                        {task.task_description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div className="w-72 md:w-full min-w-[16rem] flex-shrink-0 md:flex-shrink md:min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-purple-300 mb-2 flex items-center gap-1">
                IN PROGRESS <FaEdit className="text-purple-400" />
              </h2>
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
                      key={task._id}
                      className="bg-[#232a34] rounded-xl p-4 shadow border border-purple-500/10 transition hover:scale-[1.02] hover:border-purple-400"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white flex items-center gap-2">
                          <FaEdit className="text-purple-400" />{" "}
                          {task.task_title}
                        </span>
                        <button
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition focus:ring-2 focus:ring-green-400"
                          onClick={() => updateTaskStatus(task._id, "done")}
                          title="Mark as Done"
                        >
                          Mark as Done
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">
                        {task.task_description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* DONE */}
            <div className="w-72 md:w-full min-w-[16rem] flex-shrink-0 md:flex-shrink md:min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-green-300 mb-2 flex items-center gap-1">
                DONE <FaCheck className="text-green-400" />
              </h2>
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
                      key={task._id}
                      className="bg-[#232a34] rounded-xl p-4 shadow border border-green-500/10 flex items-center justify-between transition hover:scale-[1.0] hover:border-green-400"
                    >
                      <div>
                        <span className="font-semibold text-white flex items-center gap-2">
                          <FaCheck className="text-green-400" />{" "}
                          {task.task_title}
                        </span>
                        <p className="text-gray-300 text-sm">
                          {task.task_description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar: Chat & Progress */}
        <aside className="w-full lg:w-96 flex flex-col gap-6 md:gap-8 min-w-0">
          {/* Chat Panel */}
          <div className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 flex flex-col h-80 sm:h-96 relative">
            {/* Chat Header */}
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-blue-500/10">
              <img
                src={mentor.avatar}
                alt="Mentor"
                className="w-7 h-7 rounded-full border-2 border-blue-400 shadow"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-white text-base truncate">
                  {mentor.name}
                </span>
                <span className="text-xs text-blue-300">
                  Mentor{" "}
                  <span
                    className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    title="Online"
                  ></span>
                </span>
              </div>
              <FaComments className="text-blue-400 text-xl" />
            </div>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2 scrollbar-thin scrollbar-thumb-blue-900/40 scrollbar-track-transparent transition-all hide-scrollbar">
              {chat.map((msg, idx) => {
                const isMe = user && msg.senderID === user._id;
                const isAdmin = msg.senderRole === "admin";
                let bubbleColor = isAdmin
                  ? "bg-gradient-to-br from-green-600 to-green-400 text-white"
                  : isMe
                  ? "bg-gradient-to-br from-pink-500 to-pink-400 text-white"
                  : "bg-gradient-to-br from-blue-600 to-blue-500 text-white";
                // Alignment: self right, others left
                const alignment = isMe ? "justify-end" : "justify-start";
                const bubbleAlign = isMe ? "items-end" : "items-start";
                const bubbleRadius = isMe
                  ? "rounded-br-md rounded-tl-2xl rounded-bl-2xl"
                  : "rounded-bl-md rounded-tr-2xl rounded-br-2xl";
                return (
                  <div key={idx} className={`flex w-full ${alignment} mb-1`}>
                    {/* Avatar for others/admin, optional for self */}
                    {!isMe && (
                      <img
                        src={
                          isAdmin
                            ? "https://ui-avatars.com/api/?name=Admin"
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                msg.senderName || "User"
                              )}`
                        }
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full border border-blue-400 shadow-sm mr-2 self-end hidden sm:block"
                      />
                    )}
                    <div
                      className={`flex flex-col ${bubbleAlign} max-w-[90%] sm:max-w-[70%] w-fit`}
                    >
                      {/* Sender name and role */}
                      <div
                        className={`flex items-center gap-2 mb-0.5 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-xs font-semibold text-blue-200">
                          {isMe
                            ? "You"
                            : msg.senderName || (isAdmin ? "Admin" : "User")}
                        </span>
                        {isAdmin && (
                          <span className="ml-1 px-2 py-0.5 bg-green-700 text-green-200 text-[10px] rounded-full font-bold uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      {/* Message bubble */}
                      <div
                        className={`px-4 py-2 ${bubbleRadius} max-w-full text-sm shadow-md transition-all ${bubbleColor} break-words`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    {/* Avatar for self (optional, usually omitted) */}
                    {isMe && (
                      <img
                        src={
                          user?.photoURL ||
                          `https://ui-avatars.com/api/?name=You`
                        }
                        alt="You"
                        className="w-7 h-7 rounded-full border border-pink-400 shadow-sm ml-2 self-end hidden sm:block"
                      />
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            {/* Chat Input */}
            <form
              className="flex gap-2 mt-2 pt-2 border-t border-blue-500/10 bg-[#232a34] sticky bottom-0 z-10 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              autoComplete="off"
            >
              <input
                className="flex-1 rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm focus:ring-2 focus:ring-blue-400 transition min-w-0"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
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

          {/* Progress & Notes */}
          <div className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <FaBars className="text-yellow-400" />
              <span className="font-bold text-white text-sm sm:text-base">
                My Progress
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
              <label
                className="text-gray-400 text-xs mb-1 block"
                htmlFor="notes"
              >
                Notes
              </label>
              <textarea
                id="notes"
                className="w-full rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your progress or blockers..."
                aria-label="Notes"
              />
            </div>
          </div>
        </aside>
      </main>
      <main className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 p-2 sm:p-4 md:p-8 w-full overflow-x-hidden">
        {/* Guidance Section: How to Clone the Repository */}
        <section className="w-full mb-12">
          <div className="relative bg-gradient-to-br from-[#1a2233] via-[#232a34] to-[#181b23] rounded-2xl shadow-2xl border border-blue-500/30 p-0 sm:p-0 overflow-hidden flex flex-col md:flex-row items-stretch">
            {/* Decorative background */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="w-full h-full bg-gradient-to-tr from-blue-900/30 via-purple-900/10 to-yellow-700/10 blur-2xl animate-pulse"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 z-10 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-yellow-400 shadow-lg">
                  <FaGithub className="text-white text-2xl" />
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 drop-shadow">
                  Clone & Run the Project Locally
                </h2>
              </div>
              <p className="text-gray-300 text-base mb-6 max-w-2xl">
                Follow these simple steps to get the project running on your
                machine. If you’re new to Git or open source, don’t worry—just
                follow along and you’ll be set up in minutes!
              </p>
              <ol className="list-decimal list-inside text-gray-200 text-base space-y-3 mb-6 pl-2">
                <li>
                  <span className="font-semibold text-blue-300">
                    Install Git:
                  </span>
                  <span>
                    {" "}
                    Download and install Git from{" "}
                    <a
                      href="https://git-scm.com/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-yellow-400 transition"
                    >
                      git-scm.com
                    </a>
                    .
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-blue-300">
                    Open Terminal:
                  </span>
                  <span>
                    Jane Doe Use{" "}
                    <span className="bg-[#181b23] px-2 py-1 rounded text-blue-200 font-mono">
                      Command Prompt
                    </span>{" "}
                    or{" "}
                    <span className="bg-[#181b23] px-2 py-1 rounded text-blue-200 font-mono">
                      Git Bash
                    </span>{" "}
                    on Windows.
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-blue-300">
                    Clone the Repo:
                  </span>
                  <span> Run:</span>
                  <pre className="bg-gradient-to-r from-blue-900/60 to-blue-700/40 text-blue-200 rounded-lg p-3 mt-2 mb-2 font-mono text-base shadow-inner border border-blue-500/10">
                    git clone https://github.com/devhubs/ai-chatbot.git
                  </pre>
                </li>
                <li>
                  <span className="font-semibold text-blue-300">
                    Navigate to the Project Folder:
                  </span>
                  <pre className="bg-gradient-to-r from-blue-900/60 to-blue-700/40 text-blue-200 rounded-lg p-3 mt-2 mb-2 font-mono text-base shadow-inner border border-blue-500/10">
                    cd ai-chatbot
                  </pre>
                </li>
                <li>
                  <span className="font-semibold text-blue-300">
                    Install Dependencies:
                  </span>
                  <pre className="bg-gradient-to-r from-blue-900/60 to-blue-700/40 text-blue-200 rounded-lg p-3 mt-2 mb-2 font-mono text-base shadow-inner border border-blue-500/10">
                    npm install
                  </pre>
                </li>
                <li>
                  <span className="font-semibold text-blue-300">
                    Start the Project:
                  </span>
                  <pre className="bg-gradient-to-r from-blue-900/60 to-blue-700/40 text-blue-200 rounded-lg p-3 mt-2 mb-2 font-mono text-base shadow-inner border border-blue-500/10">
                    npm start
                  </pre>
                </li>
              </ol>
              <div className="flex items-center gap-2 text-gray-400 text-sm bg-[#232a34]/70 rounded-lg px-4 py-2 border border-blue-500/10 shadow-inner">
                <span className="font-semibold text-blue-300">Tip:</span>
                If you face any issues, ask in the project chat or check the
                README in the repository.
              </div>
            </div>
            {/* Video */}
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center z-10 p-8">
              <div className="w-full aspect-video max-w-md rounded-xl overflow-hidden border-2 border-blue-500/30 shadow-2xl bg-[#181b23]">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/QJ_VkN6R6zE"
                  title="How to Clone a GitHub Repository (Step by Step)"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="text-xs text-blue-200 mt-3 text-center font-semibold tracking-wide">
                <span className="inline-block bg-blue-900/40 px-3 py-1 rounded-full">
                  Video: How to clone a GitHub repository and run it locally
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Chat for mobile (fixed bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#232a34] border-t border-blue-500/10 p-2 flex gap-2 z-50">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-[#181b23] text-white border border-blue-500/20 focus:outline-none text-sm"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          aria-label="Type a message"
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg transition flex items-center"
          onClick={sendMessage}
          aria-label="Send message"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ContributionPage;
