import React, { useState, useRef, useEffect } from "react";
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
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("Excited to contribute!");
  const [descExpanded, setDescExpanded] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Task status update handler
  const updateTaskStatus = (id, newStatus) => {
    setTasks((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // Chat send handler
  const sendMessage = () => {
    if (message.trim()) {
      setChat([...chat, { sender: "me", text: message }]);
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
      {/* Project Overview Header */}
      <header className="bg-[#181b23] border-b border-blue-500/20 px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1 flex items-center gap-2 flex-wrap">
            AI Chatbot System
            <span className="ml-2 text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded-full">
              Open
            </span>
          </h1>
          <div className="text-gray-300 max-w-xl relative text-sm sm:text-base">
            <span>
              {descExpanded
                ? "Build a smart chatbot for customer support. Integrate with our API and deploy to production. This project aims to automate responses, improve customer satisfaction, and reduce manual workload. You'll work with a modern stack and collaborate with experienced mentors."
                : "Build a smart chatbot for customer support. Integrate with our API and deploy to production."}
            </span>
            <button
              className="ml-2 text-blue-400 hover:underline text-xs"
              onClick={() => setDescExpanded((v) => !v)}
              aria-label={descExpanded ? "Show less" : "Show more"}
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
          <a
            href="https://github.com/devhubs/ai-chatbot"
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
                {tasks.filter((t) => t.status === "todo").length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-blue-500/10">
                    All tasks started!
                  </div>
                )}
                {tasks
                  .filter((t) => t.status === "todo")
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 transition hover:scale-[1.02] hover:border-blue-400"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white flex items-center gap-2">
                          <FaRegStickyNote className="text-blue-400" />{" "}
                          {task.title}
                        </span>
                        <button
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition focus:ring-2 focus:ring-yellow-400"
                          onClick={() =>
                            updateTaskStatus(task.id, "inprogress")
                          }
                          title="Mark as In Progress"
                        >
                          Mark In Progress
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{task.desc}</p>
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
                {tasks.filter((t) => t.status === "inprogress").length ===
                  0 && (
                  <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-purple-500/10">
                    No tasks in progress.
                  </div>
                )}
                {tasks
                  .filter((t) => t.status === "inprogress")
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#232a34] rounded-xl p-4 shadow border border-purple-500/10 transition hover:scale-[1.02] hover:border-purple-400"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white flex items-center gap-2">
                          <FaEdit className="text-purple-400" /> {task.title}
                        </span>
                        <button
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition focus:ring-2 focus:ring-green-400"
                          onClick={() => updateTaskStatus(task.id, "done")}
                          title="Mark as Done"
                        >
                          Mark as Done
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{task.desc}</p>
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
                {tasks.filter((t) => t.status === "done").length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4 bg-[#232a34] rounded-xl border border-green-500/10">
                    No tasks done yet.
                  </div>
                )}
                {tasks
                  .filter((t) => t.status === "done")
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#232a34] rounded-xl p-4 shadow border border-green-500/10 flex items-center justify-between transition hover:scale-[1.0] hover:border-green-400"
                    >
                      <div>
                        <span className="font-semibold text-white flex items-center gap-2">
                          <FaCheck className="text-green-400" /> {task.title}
                        </span>
                        <p className="text-gray-300 text-sm">{task.desc}</p>
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
          <div className="bg-[#232a34] rounded-xl p-4 shadow border border-blue-500/10 flex flex-col h-72 sm:h-80">
            <div className="flex items-center gap-2 mb-2">
              <FaComments className="text-blue-400" />
              <span className="font-bold text-white text-sm sm:text-base">
                Chat with Owner / Mentor
              </span>
              <img
                src={mentor.avatar}
                alt="Mentor"
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-blue-400 ml-2"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-2">
              {chat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === "me"
                      ? "justify-end"
                      : msg.sender === "mentor"
                      ? "justify-start"
                      : "justify-center"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                      msg.sender === "me"
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
