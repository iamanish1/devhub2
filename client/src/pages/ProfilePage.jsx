import Navbar from "../components/NavBar";
import axios from "axios";
import { useState, useEffect } from "react";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaGlobe,
  FaEdit,
  FaCode,
  FaRocket,
  FaTrophy,
  FaCalendar,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaMoon,
  FaSun,
  FaPalette,
  FaChartBar,
  FaDownload,
  FaHtml5,
  FaCss3Alt,
  FaJs,
  FaReact,
  FaNodeJs,
  FaDatabase,
  FaDocker,
  FaPython,
  FaGitAlt,
  FaAws,
} from "react-icons/fa";

import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState({});
  const [savedProjects, setSavedProjects] = useState([]);
  const [loadingSavedProjects, setLoadingSavedProjects] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [theme, setTheme] = useState("dark");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("30D");
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserProfile(response.data.profile);
        console.log("User profile fetched:", response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch saved projects
  useEffect(() => {
    const fetchSavedProjects = async () => {
      try {
        setLoadingSavedProjects(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          "http://localhost:8000/api/saved-projects/saved",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSavedProjects(response.data.savedProjects);
      } catch (error) {
        console.error("Error fetching saved projects:", error);
      } finally {
        setLoadingSavedProjects(false);
      }
    };
    fetchSavedProjects();
  }, []);

  // Mock recent_projects if not present (for demo)
  const recentProjects =
    userProfile.recent_projects && userProfile.recent_projects.length > 0
      ? userProfile.recent_projects
      : [
          {
            name: "AI Chatbot",
            date: "May 2025",
            description: "A smart chatbot using NLP.",
            tech: ["React", "Node.js", "OpenAI"],
            status: "completed",
          },
          {
            name: "Bug Tracker",
            date: "Apr 2025",
            description: "A collaborative bug tracking platform.",
            tech: ["React", "Express", "MongoDB"],
            status: "in-progress",
          },
        ];

  // Skill icon mapping
  const getSkillIcon = (skillName) => {
    const iconMap = {
      JavaScript: FaJs,
      React: FaReact,
      "Node.js": FaNodeJs,
      Python: FaPython,
      MongoDB: FaDatabase,
      Docker: FaDocker,
      HTML: FaHtml5,
      CSS: FaCss3Alt,
      Git: FaGitAlt,
      AWS: FaAws,
      Express: FaNodeJs,
      TypeScript: FaJs,
      "Vue.js": FaJs,
      Angular: FaJs,
      PostgreSQL: FaDatabase,
      MySQL: FaDatabase,
      Redis: FaDatabase,
      Kubernetes: FaDocker,
      Jenkins: FaDocker,
      Nginx: FaDocker,
    };
    return iconMap[skillName] || FaCode;
  };

  // Get skill level label
  const getSkillLevel = (proficiency) => {
    if (proficiency >= 90)
      return {
        label: "Expert",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
      };
    if (proficiency >= 80)
      return {
        label: "Advanced",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      };
    if (proficiency >= 70)
      return {
        label: "Intermediate",
        color: "text-green-400",
        bg: "bg-green-500/10",
      };
    return {
      label: "Beginner",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    };
  };

  // Mock skills with enhanced data
  const skills =
    userProfile.user_profile_skills &&
    userProfile.user_profile_skills.length > 0
      ? userProfile.user_profile_skills.map((skill) => ({
          name: skill,
          proficiency: Math.floor(Math.random() * 40) + 60, // 60-100%
          category: "Programming",
          experience: Math.floor(Math.random() * 3) + 1, // 1-4 years
          projects: Math.floor(Math.random() * 10) + 2, // 2-12 projects
        }))
      : [
          {
            name: "JavaScript",
            proficiency: 85,
            category: "Frontend",
            experience: 3,
            projects: 8,
          },
          {
            name: "React",
            proficiency: 80,
            category: "Frontend",
            experience: 2,
            projects: 6,
          },
          {
            name: "Node.js",
            proficiency: 75,
            category: "Backend",
            experience: 2,
            projects: 5,
          },
          {
            name: "Python",
            proficiency: 70,
            category: "Programming",
            experience: 1,
            projects: 3,
          },
          {
            name: "MongoDB",
            proficiency: 65,
            category: "Database",
            experience: 1,
            projects: 4,
          },
          {
            name: "Docker",
            proficiency: 60,
            category: "DevOps",
            experience: 1,
            projects: 2,
          },
        ];

  // Mock activity feed
  const mockActivityFeed = [
    {
      id: 1,
      type: "project_completed",
      title: "Completed AI Chatbot Project",
      description: "Successfully delivered the NLP-powered chatbot",
      timestamp: "2 hours ago",
      icon: "🎉",
      color: "green",
    },
    {
      id: 2,
      type: "skill_endorsed",
      title: "React skill endorsed by John Doe",
      description: "Received endorsement for React development",
      timestamp: "1 day ago",
      icon: "⭐",
      color: "yellow",
    },
    {
      id: 3,
      type: "project_started",
      title: "Started Bug Tracker Project",
      description: "Began development of collaborative bug tracking platform",
      timestamp: "3 days ago",
      icon: "🚀",
      color: "blue",
    },
    {
      id: 4,
      type: "achievement_unlocked",
      title: "First 100 Contributions",
      description: "Reached milestone of 100 project contributions",
      timestamp: "1 week ago",
      icon: "🏆",
      color: "purple",
    },
  ];

  // Mock analytics data for Phase 3
  const analyticsData = {
    monthlyEarnings: [1200, 1800, 1500, 2200, 1900, 2500],
    projectCompletion: [85, 92, 78, 95, 88, 91],
    skillGrowth: {
      JavaScript: [70, 75, 80, 85, 88, 90],
      React: [60, 68, 75, 82, 85, 88],
      "Node.js": [65, 70, 75, 80, 83, 85],
      Python: [50, 58, 65, 72, 78, 82],
    },
    weeklyActivity: Array.from({ length: 52 }, () =>
      Math.floor(Math.random() * 10)
    ),
  };

  // Advanced Analytics Functions
  const getTimePeriodData = (period) => {
    const periods = {
      "7D": { days: 7, label: "Last 7 Days" },
      "30D": { days: 30, label: "Last 30 Days" },
      "90D": { days: 90, label: "Last 90 Days" },
      "1Y": { days: 365, label: "Last Year" },
    };
    return periods[period] || periods["30D"];
  };

  const getRealTimeData = () => {
    if (!isRealTimeEnabled) return analyticsData;

    // Simulate real-time updates
    const now = new Date();
    const updatedData = {
      ...analyticsData,
      monthlyEarnings: analyticsData.monthlyEarnings.map(
        (earning) => earning + Math.floor(Math.random() * 100) - 50
      ),
      projectCompletion: analyticsData.projectCompletion.map((completion) =>
        Math.min(
          100,
          Math.max(0, completion + Math.floor(Math.random() * 10) - 5)
        )
      ),
    };
    return updatedData;
  };

  // Theme configurations
  const themes = {
    dark: {
      bg: "from-[#0f0f0f] to-[#1a1a2e]",
      card: "from-[#1a1a1a]/80 to-[#2a2a2a]/80",
      border: "border-blue-500/20",
      text: "text-white",
    },
    light: {
      bg: "from-[#f8fafc] to-[#e2e8f0]",
      card: "from-white/80 to-gray-50/80",
      border: "border-blue-500/30",
      text: "text-gray-900",
    },
    purple: {
      bg: "from-[#1a0b2e] to-[#2d1b4e]",
      card: "from-[#2a1b4e]/80 to-[#3d2b6e]/80",
      border: "border-purple-500/20",
      text: "text-white",
    },
  };

  // Real-time data simulation effect
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // Simulate real-time data updates
      const updatedAnalytics = {
        ...analyticsData,
        monthlyEarnings: analyticsData.monthlyEarnings.map(
          (earning) => earning + Math.floor(Math.random() * 50) - 25
        ),
        projectCompletion: analyticsData.projectCompletion.map((completion) =>
          Math.min(
            100,
            Math.max(0, completion + Math.floor(Math.random() * 5) - 2)
          )
        ),
      };

      // In a real app, this would update the state
      console.log("Real-time data updated:", updatedAnalytics);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, analyticsData]);

  // Print styles
  useEffect(() => {
    if (isPrintMode) {
      const style = document.createElement("style");
      style.textContent = `
        @media print {
          .print-mode {
            background: white !important;
            color: black !important;
          }
          .print-mode * {
            color: black !important;
            background: white !important;
          }
          .print-mode .bg-gradient-to-br {
            background: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
          }
        }
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }
  }, [isPrintMode]);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );

  if (!userProfile || !userProfile._id)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-xl">No user data found.</div>
      </div>
    );

  const tabs = [
    { id: "overview", label: "Overview", icon: FaCode },
    { id: "projects", label: "Projects", icon: FaRocket },
    { id: "skills", label: "Skills", icon: FaTrophy },
    { id: "activity", label: "Activity", icon: FaCalendar },
  ];

  return (
    <>
      <Navbar />
      <main className={`min-h-screen bg-gradient-to-b ${themes[theme].bg}`}>
        {/* Hero Section */}
        <motion.section
          className="relative pt-24 pb-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#1a1a1a]/80 to-[#2a2a2a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8 mb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Avatar Section */}
                <div className="relative">
                  <div className="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10">
                    <div className="h-24 w-24 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {userProfile.username?.username
                          ?.charAt(0)
                          .toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  {/* Online Status */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                        {userProfile.username?.username || "Developer"}
                      </h1>
                      <p className="text-xl text-blue-400 mb-2">
                        {userProfile.username?.usertype ||
                          "Full Stack Developer"}
                      </p>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          <span>Mumbai, India</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaCalendar />
                          <span>Member since 2024</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link to="/editprofile">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2">
                          <FaEdit />
                          Edit Profile
                        </button>
                      </Link>

                      {/* Download Resume */}
                      <button className="p-3 rounded-xl bg-transparent border border-green-500 text-green-400 hover:bg-green-500/10 transition-all duration-300">
                        <FaDownload className="text-lg" />
                      </button>

                      {/* Theme Toggle */}
                      <div className="relative">
                        <button
                          onClick={() => setShowThemeMenu(!showThemeMenu)}
                          className="p-3 rounded-xl bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                        >
                          <FaPalette className="text-lg" />
                        </button>

                        <AnimatePresence>
                          {showThemeMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full right-0 mt-2 bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-xl border border-blue-500/20 p-2 shadow-xl backdrop-blur-xl"
                            >
                              <div className="flex flex-col gap-1">
                                {Object.keys(themes).map((themeName) => (
                                  <button
                                    key={themeName}
                                    onClick={() => {
                                      setTheme(themeName);
                                      setShowThemeMenu(false);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                      theme === themeName
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-300 hover:bg-blue-500/10"
                                    }`}
                                  >
                                    {themeName.charAt(0).toUpperCase() +
                                      themeName.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-300 mt-4 text-lg leading-relaxed">
                    {userProfile.user_profile_bio ||
                      "Passionate developer focused on creating innovative solutions. Always eager to learn new technologies and contribute to meaningful projects."}
                  </p>

                  {/* Social Links */}
                  <div className="flex gap-4 mt-6">
                    <a
                      href={userProfile.user_profile_github || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FaGithub className="text-2xl" />
                    </a>
                    <a
                      href={userProfile.user_profile_linkedIn || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FaLinkedin className="text-2xl" />
                    </a>
                    <a
                      href={userProfile.user_profile_instagram || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-pink-400 transition-colors"
                    >
                      <FaInstagram className="text-2xl" />
                    </a>
                    <a
                      href={userProfile.user_profile_website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <FaGlobe className="text-2xl" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {userProfile.user_project_contribution || 12}
                </div>
                <div className="text-gray-300">Contributions</div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {userProfile.user_completed_projects || 8}
                </div>
                <div className="text-gray-300">Completed Projects</div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Navigation Tabs */}
        <section className="px-4 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-2">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="text-lg" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Saved Projects Section */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Saved Projects
                    </h2>
                  </div>

                  {loadingSavedProjects ? (
                    <div className="text-gray-400 text-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      Loading saved projects...
                    </div>
                  ) : savedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedProjects.map((savedProject) => (
                        <motion.div
                          key={savedProject._id}
                          className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 cursor-pointer group"
                          whileHover={{ y: -5, scale: 1.02 }}
                          onClick={() =>
                            window.open(
                              `/biding/${savedProject.project._id}`,
                              "_blank"
                            )
                          }
                        >
                          {savedProject.project.Project_cover_photo && (
                            <div className="relative overflow-hidden rounded-t-2xl">
                              <img
                                src={`http://localhost:8000${savedProject.project.Project_cover_photo}`}
                                alt={savedProject.project.project_Title}
                                className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {savedProject.project.project_Title}
                              </h3>
                              <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-1 rounded-full">
                                {new Date(
                                  savedProject.savedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                              {savedProject.project.Project_Description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-400 font-semibold">
                                ${savedProject.project.project_starting_bid}
                              </span>
                              <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
                                {savedProject.project.Project_tech_stack}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No saved projects yet
                      </h3>
                      <p className="text-gray-400">
                        Click the bookmark icon on any project to save it here!
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Projects Section */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <FaRocket className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Recent Projects
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {recentProjects.map((project, index) => (
                      <motion.div
                        key={index}
                        className="bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300"
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {project.name}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  project.status === "completed"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {project.status === "completed"
                                  ? "Completed"
                                  : "In Progress"}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {project.tech?.map((tech, techIndex) => (
                                <span
                                  key={techIndex}
                                  className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-500 text-sm">
                            {project.date}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  All Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentProjects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 cursor-pointer group"
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {project.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tech?.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{project.date}</span>
                          <span className="text-blue-400">View Details →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "skills" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Skills Overview Header */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Skills & Technologies
                      </h2>
                      <p className="text-gray-400 text-lg">
                        Professional expertise across multiple domains
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400">
                        {skills.length}
                      </div>
                      <div className="text-gray-400 text-sm">Technologies</div>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map((skill, index) => {
                      const SkillIcon = getSkillIcon(skill.name);
                      const skillLevel = getSkillLevel(skill.proficiency);

                      return (
                        <motion.div
                          key={index}
                          className="group relative bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300"
                          whileHover={{ y: -4, scale: 1.02 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          {/* Skill Header */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                              <SkillIcon className="text-2xl text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {skill.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${skillLevel.bg} ${skillLevel.color}`}
                                >
                                  {skillLevel.label}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  • {skill.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">
                                Proficiency
                              </span>
                              <span className="text-sm font-semibold text-blue-400">
                                {skill.proficiency}%
                              </span>
                            </div>
                            <div className="relative w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                              <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.proficiency}%` }}
                                transition={{
                                  duration: 1.5,
                                  delay: index * 0.1,
                                  ease: "easeOut",
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
                            </div>
                          </div>

                          {/* Skill Stats */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-gray-400">
                              <span>📅</span>
                              <span>
                                {skill.experience} year
                                {skill.experience > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <span>📁</span>
                              <span>{skill.projects} projects</span>
                            </div>
                          </div>

                          {/* Hover Effect Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Skills Summary & Categories */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Skills Overview
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Frontend Skills */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl border border-blue-500/20 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <FaHtml5 className="text-xl text-blue-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white">
                          Frontend
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {skills
                          .filter((skill) => skill.category === "Frontend")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-gray-300 text-sm">
                                {skill.name}
                              </span>
                              <span className="text-blue-400 text-sm font-medium">
                                {skill.proficiency}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Backend Skills */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl border border-green-500/20 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FaNodeJs className="text-xl text-green-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white">
                          Backend
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {skills
                          .filter((skill) => skill.category === "Backend")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-gray-300 text-sm">
                                {skill.name}
                              </span>
                              <span className="text-green-400 text-sm font-medium">
                                {skill.proficiency}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* DevOps Skills */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl border border-purple-500/20 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <FaDocker className="text-xl text-purple-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white">
                          DevOps
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {skills
                          .filter((skill) => skill.category === "DevOps")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-gray-300 text-sm">
                                {skill.name}
                              </span>
                              <span className="text-purple-400 text-sm font-medium">
                                {skill.proficiency}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Contribution Activity */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Contribution Activity
                      </h3>
                      <p className="text-gray-400">
                        Your coding activity over the past year
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          1,247
                        </div>
                        <div className="text-gray-400 text-sm">
                          Total Contributions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">
                          156
                        </div>
                        <div className="text-gray-400 text-sm">This Year</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced GitHub-Style Activity Heatmap */}
                  <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          Activity Heatmap
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Your contribution activity over the past year
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Time Period Selector */}
                        <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg border border-blue-500/20 p-1">
                          {["7D", "30D", "90D", "1Y"].map((period) => (
                            <button
                              key={period}
                              onClick={() => setSelectedTimePeriod(period)}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ${
                                selectedTimePeriod === period
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-400 hover:text-white hover:bg-blue-500/10"
                              }`}
                            >
                              {period}
                            </button>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>Less</span>
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className="w-3 h-3 rounded-sm"
                                style={{
                                  backgroundColor:
                                    level === 0
                                      ? "#161b22"
                                      : level === 1
                                      ? "#0e4429"
                                      : level === 2
                                      ? "#006d32"
                                      : level === 3
                                      ? "#26a641"
                                      : "#39d353",
                                }}
                              />
                            ))}
                          </div>
                          <span>More</span>
                        </div>
                      </div>
                    </div>

                                         {/* Enhanced Activity Heatmap with Perfect Size Boxes */}
                     <div className="relative">
                       {/* Month Labels Row */}
                       <div className="flex mb-3">
                         <div className="w-8"></div> {/* Spacer for day labels */}
                         <div className="flex-1 flex">
                           {[
                             "Jan",
                             "Feb",
                             "Mar",
                             "Apr",
                             "May",
                             "Jun",
                             "Jul",
                             "Aug",
                             "Sep",
                             "Oct",
                             "Nov",
                             "Dec",
                           ].map((month, index) => (
                             <div
                               key={month}
                               className="flex-1 text-center text-sm text-gray-400 font-medium"
                             >
                               {month}
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Main Heatmap Container */}
                       <div className="flex">
                         {/* Day Labels Column */}
                         <div className="w-8 flex flex-col">
                           {["", "Mon", "", "Wed", "", "Fri", ""].map(
                             (day, index) => (
                               <div
                                 key={index}
                                 className="text-xs text-gray-400 text-right pr-2 h-4 leading-4 mb-1"
                               >
                                 {day}
                               </div>
                             )
                           )}
                         </div>

                                                   {/* Contribution Squares Container */}
                          <div className="flex-1">
                            <div className="grid grid-cols-52 gap-1.5">
                              {Array.from({ length: 365 }, (_, i) => {
                                // Calculate the exact date for each day
                                const today = new Date();
                                const date = new Date(today.getFullYear(), 0, 1); // Start of year
                                date.setDate(date.getDate() + i);
                                
                                // Generate more realistic contribution levels
                                let contributionLevel;
                                const dayOfWeek = date.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                const isRecent = i >= 335; // Last 30 days
                                
                                if (isRecent) {
                                  // Higher activity in recent days
                                  contributionLevel = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2);
                                } else if (isWeekend) {
                                  // Lower activity on weekends
                                  contributionLevel = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
                                } else {
                                  // Normal weekday activity
                                  contributionLevel = Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 1 : 0;
                                }
                                
                                const contributionCount = contributionLevel === 0 ? 0 : Math.floor(Math.random() * 8) + 1;

                               return (
                                 <motion.div
                                   key={i}
                                   className="w-4 h-4 rounded-md cursor-pointer group relative border border-gray-700/40"
                                   whileHover={{ 
                                     scale: 1.3, 
                                     zIndex: 10,
                                     boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)"
                                   }}
                                   initial={{ opacity: 0, scale: 0.8 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   transition={{
                                     duration: 0.4,
                                     delay: i * 0.002,
                                     type: "spring",
                                     stiffness: 100
                                   }}
                                   style={{
                                     backgroundColor:
                                       contributionLevel === 0
                                         ? "#374151" // More visible gray for no contributions
                                         : contributionLevel === 1
                                         ? "#0e4429"
                                         : contributionLevel === 2
                                         ? "#006d32"
                                         : contributionLevel === 3
                                         ? "#26a641"
                                         : "#39d353",
                                     boxShadow: contributionLevel > 0 ? '0 2px 6px rgba(0, 0, 0, 0.3)' : 'none'
                                   }}
                                 >
                                   {/* Enhanced Tooltip */}
                                   <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 border border-gray-700/50 shadow-2xl">
                                     <div className="font-bold text-green-400 mb-1">
                                       {contributionCount} contributions
                                     </div>
                                     <div className="text-gray-300 text-xs">
                                       {date.toLocaleDateString("en-US", {
                                         weekday: "long",
                                         year: "numeric",
                                         month: "long",
                                         day: "numeric",
                                       })}
                                     </div>
                                     <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-gray-900/95"></div>
                                   </div>
                                 </motion.div>
                               );
                             })}
                           </div>
                         </div>
                       </div>
                     </div>
                  </div>

                  {/* Contribution Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FaCode className="text-green-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-400">
                            156
                          </div>
                          <div className="text-gray-400 text-sm">This Year</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <FaCalendar className="text-blue-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">
                            23
                          </div>
                          <div className="text-gray-400 text-sm">
                            Current Streak
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <FaTrophy className="text-purple-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-400">
                            45
                          </div>
                          <div className="text-gray-400 text-sm">Best Day</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <FaRocket className="text-orange-400" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-400">
                            89%
                          </div>
                          <div className="text-gray-400 text-sm">
                            Consistency
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Analytics Dashboard */}
                <div
                  className={`bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8 ${
                    isPrintMode ? "print-mode" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Analytics Dashboard
                      </h3>
                      <p className="text-gray-400">
                        Comprehensive insights into your performance
                      </p>
                      {isRealTimeEnabled && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm font-medium">
                            Live Updates
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Real-time Toggle */}
                      <button
                        onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                          isRealTimeEnabled
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-600 hover:bg-gray-700 text-white"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isRealTimeEnabled
                              ? "bg-white animate-pulse"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        Live
                      </button>

                      <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                      >
                        <FaChartBar className="text-sm" />
                        {showAnalytics ? "Hide" : "Show"} Analytics
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAnalytics && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-8"
                      >
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-3 bg-blue-500/20 rounded-lg">
                                <FaChartBar className="text-blue-400" />
                              </div>
                              <span className="text-green-400 text-sm font-medium">
                                +12.5%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              $2,450
                            </div>
                            <div className="text-gray-400 text-sm">
                              Monthly Earnings
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-3 bg-green-500/20 rounded-lg">
                                <FaRocket className="text-green-400" />
                              </div>
                              <span className="text-green-400 text-sm font-medium">
                                +8.2%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              92%
                            </div>
                            <div className="text-gray-400 text-sm">
                              Project Success Rate
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-3 bg-purple-500/20 rounded-lg">
                                <FaTrophy className="text-purple-400" />
                              </div>
                              <span className="text-green-400 text-sm font-medium">
                                +15.3%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              4.8
                            </div>
                            <div className="text-gray-400 text-sm">
                              Average Rating
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-3 bg-orange-500/20 rounded-lg">
                                <FaCode className="text-orange-400" />
                              </div>
                              <span className="text-green-400 text-sm font-medium">
                                +22.1%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              156
                            </div>
                            <div className="text-gray-400 text-sm">
                              Lines of Code
                            </div>
                          </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Monthly Earnings Chart */}
                          <div className="bg-[#2a2a2a] rounded-2xl border border-blue-500/20 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-lg font-semibold text-white">
                                Monthly Earnings Trend
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>Earnings</span>
                              </div>
                            </div>
                            <div className="flex items-end gap-2 h-32">
                              {getRealTimeData().monthlyEarnings.map(
                                (earnings, index) => (
                                  <motion.div
                                    key={index}
                                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-sm relative group"
                                    initial={{ height: 0 }}
                                    animate={{
                                      height: `${(earnings / 3000) * 100}%`,
                                    }}
                                    transition={{
                                      duration: 0.8,
                                      delay: index * 0.1,
                                    }}
                                  >
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                      ${earnings}
                                    </div>
                                  </motion.div>
                                )
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                              <span>Jan</span>
                              <span>Mar</span>
                              <span>May</span>
                              <span>Jul</span>
                              <span>Sep</span>
                              <span>Nov</span>
                            </div>
                          </div>

                          {/* Skill Growth Chart */}
                          <div className="bg-[#2a2a2a] rounded-2xl border border-blue-500/20 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-lg font-semibold text-white">
                                Skill Growth (6 months)
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>Progress</span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              {Object.entries(
                                getRealTimeData().skillGrowth
                              ).map(([skill, growth], index) => (
                                <div key={skill} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm font-medium">
                                      {skill}
                                    </span>
                                    <span className="text-blue-400 text-sm font-semibold">
                                      {growth[growth.length - 1]}%
                                    </span>
                                  </div>
                                  <div className="relative bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${growth[growth.length - 1]}%`,
                                      }}
                                      transition={{
                                        duration: 1.5,
                                        delay: index * 0.2,
                                        ease: "easeOut",
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Real-time Activity Feed */}
                          <div className="bg-[#2a2a2a] rounded-2xl border border-blue-500/20 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-lg font-semibold text-white">
                                Real-time Activity
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Live</span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              {mockActivityFeed
                                .slice(0, 3)
                                .map((activity, index) => (
                                  <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      duration: 0.5,
                                      delay: index * 0.1,
                                    }}
                                    className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                                  >
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                        activity.color === "green"
                                          ? "bg-green-500/20"
                                          : activity.color === "yellow"
                                          ? "bg-yellow-500/20"
                                          : activity.color === "blue"
                                          ? "bg-blue-500/20"
                                          : "bg-purple-500/20"
                                      }`}
                                    >
                                      {activity.icon}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="text-white font-medium mb-1">
                                        {activity.title}
                                      </h5>
                                      <p className="text-gray-400 text-sm">
                                        {activity.description}
                                      </p>
                                    </div>
                                    <span className="text-gray-500 text-xs">
                                      {activity.timestamp}
                                    </span>
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Performance Insights */}
                        <div className="bg-[#2a2a2a] rounded-2xl border border-blue-500/20 p-6">
                          <h4 className="text-lg font-semibold text-white mb-6">
                            Performance Insights
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                                <div>
                                  <h5 className="text-white font-medium">
                                    Best Performing Skill
                                  </h5>
                                  <p className="text-gray-400 text-sm">
                                    JavaScript - 90% proficiency
                                  </p>
                                </div>
                                <div className="text-green-400 text-2xl font-bold">
                                  90%
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                                <div>
                                  <h5 className="text-white font-medium">
                                    Most Active Day
                                  </h5>
                                  <p className="text-gray-400 text-sm">
                                    Wednesday - 45 contributions
                                  </p>
                                </div>
                                <div className="text-blue-400 text-2xl font-bold">
                                  45
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                                <div>
                                  <h5 className="text-white font-medium">
                                    Project Success Rate
                                  </h5>
                                  <p className="text-gray-400 text-sm">
                                    92% of projects completed on time
                                  </p>
                                </div>
                                <div className="text-green-400 text-2xl font-bold">
                                  92%
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                                <div>
                                  <h5 className="text-white font-medium">
                                    Average Response Time
                                  </h5>
                                  <p className="text-gray-400 text-sm">
                                    2.3 hours to client inquiries
                                  </p>
                                </div>
                                <div className="text-purple-400 text-2xl font-bold">
                                  2.3h
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  Activity Timeline
                </h2>
                <div className="space-y-6">
                  {mockActivityFeed.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          activity.color === "green"
                            ? "bg-green-500/20"
                            : activity.color === "yellow"
                            ? "bg-yellow-500/20"
                            : activity.color === "blue"
                            ? "bg-blue-500/20"
                            : "bg-purple-500/20"
                        }`}
                      >
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {activity.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {activity.description}
                        </p>
                        <span className="text-gray-500 text-xs">
                          {activity.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;
