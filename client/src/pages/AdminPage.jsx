/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaProjectDiagram,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";
import Navbar from "../components/NavBar";
import { Link } from "react-router-dom";

// Chart.js imports
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const dummyProjects = [];

const dummyApplicants = [
  { id: 1, name: "Anish", project: "AI Chatbot", status: "Pending" },
  { id: 2, name: "Riya", project: "Bug Tracker", status: "Accepted" },
];

const statusColors = {
  Open: "text-green-400 bg-green-900/40",
  Closed: "text-red-400 bg-red-900/40",
  Pending: "text-yellow-400 bg-yellow-900/40",
  Accepted: "text-blue-400 bg-blue-900/40",
  Rejected: "text-red-400 bg-red-900/40",
};

const AdminPage = () => {
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setstats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  For Projects and Applicants
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);

  // Add at the top of your AdminPage component
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState(null);

  // Fetch applicants when "applicants" view is active
  useEffect(() => {
    if (view === "applicants") {
      setApplicantsLoading(true);
      axios
        .get("http://localhost:8000/api/admin/applicant", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          setApplicants(res.data.applicants || []);
          console.log("Applicants fetched:", res.data.applicants);
          setApplicantsError(null);
        })
        .catch(() => setApplicantsError("Failed to fetch applicants"))
        .finally(() => setApplicantsLoading(false));
    }
  }, [view]);

  // Fetch project for "My projects" section

  useEffect(() => {
    if (view === "projects") {
      setProjectsLoading(true);
      axios
        .get("http://localhost:8000/api/admin/myproject", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          setProjects(res.data.projects || []);
          console.log("Projects fetched:", res.data.projects);
          setProjectsError(null);
        })
        .catch(() => setProjectsError("Failed to fetch projects"))
        .finally(() => setProjectsLoading(false));
    }
  }, [view]);

  // Dashboard stats
  const totalProjects = stats ? stats.totalProjects : dummyProjects.length;
  const openProjects = stats
    ? stats.totalActiveProjects
    : dummyProjects.filter((p) => p.status === "Open").length;
  const closedProjects = stats
    ? stats.totalCompletedProjects
    : dummyProjects.filter((p) => p.status === "Closed").length;
  const totalApplicants = stats ? stats.totalBids : dummyApplicants.length;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/admin/overview",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setstats(response.data);
        setError(null);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch stats");
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Chart data
  const chartData = {
    labels: [
      "Total Projects",
      "Open Projects",
      "Closed Projects",
      "Applicants",
    ],
    datasets: [
      {
        label: "Overview",
        data: [totalProjects, openProjects, closedProjects, totalApplicants],
        backgroundColor: [
          "rgba(59,130,246,0.7)", // blue for Total Projects
          "rgba(34,197,94,0.7)", // green for Open Projects
          "rgba(239,68,68,0.7)", // red for Closed Projects
          "rgba(251,191,36,0.7)", // orange for Applicants
        ],
        borderColor: [
          "rgba(59,130,246,1)",
          "rgba(34,197,94,1)",
          "rgba(239,68,68,1)",
          "rgba(251,191,36,1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const handleDelteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/admin/deleteproject/${projectId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        alert("Project deleted successfully");
        setProjects((prev) => prev.filter((proj) => proj._id !== projectId));
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again later.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e]">
      <Navbar />
      {/* Sidebar */}
      <aside className="w-64 bg-[#181b23] text-white flex flex-col p-6 border-r border-blue-500/20 shadow-lg">
        <h2 className="text-3xl font-extrabold mb-10 text-blue-400 tracking-wide">
          DevHubs Admin
        </h2>
        <nav className="flex flex-col gap-3">
          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "dashboard"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "projects"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("projects")}
          >
            My Projects
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
              view === "applicants"
                ? "bg-blue-500 text-white shadow"
                : "hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            onClick={() => setView("applicants")}
          >
            Applicants
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Dashboard Section */}
        {view === "dashboard" && (
          <section>
            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-2 text-blue-400">
                Welcome, Admin!
              </h1>
              <p className="text-gray-300 text-lg">
                Here’s a quick overview of your DevHubs platform activity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              <div className="bg-gradient-to-br from-blue-900/60 to-blue-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaProjectDiagram className="text-4xl text-blue-400 mb-3" />
                <div className="text-3xl font-extrabold text-blue-400">
                  {loading ? "..." : totalProjects}
                </div>
                <div className="mt-2 text-gray-300">Total Projects</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/60 to-green-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaCheckCircle className="text-4xl text-green-400 mb-3" />
                <div className="text-3xl font-extrabold text-green-400">
                  {loading ? "..." : openProjects}
                </div>
                <div className="mt-2 text-gray-300">Open Projects</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/60 to-red-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaTimesCircle className="text-4xl text-red-400 mb-3" />
                <div className="text-3xl font-extrabold text-red-400">
                  {loading ? "..." : closedProjects}
                </div>
                <div className="mt-2 text-gray-300">Closed Projects</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/60 to-purple-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaUsers className="text-4xl text-purple-400 mb-3" />
                <div className="text-3xl font-extrabold text-purple-400">
                  {loading ? "..." : totalApplicants}
                </div>
                <div className="mt-2 text-gray-300">Total Applicants</div>
              </div>
            </div>
            <div className="relative bg-[#181b23]/80 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-10 border border-blue-500/10 flex flex-col items-center overflow-hidden mt-8 w-full max-w-3xl mx-auto">
              {/* Subtle animated background gradient */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="w-full h-full bg-gradient-to-tr from-blue-900/20 via-purple-900/10 to-yellow-700/10 blur-2xl animate-pulse"></div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 z-10 tracking-wide drop-shadow">
                Platform Overview
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 rounded-full mb-6 z-10"></div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 z-10 w-full">
                <div className="w-44 h-44 md:w-60 md:h-60 flex items-center justify-center bg-[#232a34]/80 rounded-xl shadow-lg border border-blue-500/10">
                  <Doughnut
                    data={chartData}
                    options={{
                      plugins: { legend: { display: false } },
                      cutout: "75%",
                      animation: { animateRotate: true, animateScale: true },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
                {/* Modern Legend */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {chartData.labels.map((label, idx) => (
                    <div
                      key={label}
                      className="flex items-center justify-between bg-[#232a34]/70 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              chartData.datasets[0].backgroundColor[idx],
                            boxShadow:
                              "0 0 6px 0 " +
                              chartData.datasets[0].backgroundColor[idx],
                          }}
                        ></span>
                        <span className="text-sm md:text-base font-medium text-gray-200">
                          {label}
                        </span>
                      </div>
                      <span className="text-base md:text-lg font-bold text-blue-200">
                        {chartData.datasets[0].data[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects Section */}

        {view === "projects" && (
          <section>
            <h1 className="text-4xl font-bold mb-8 text-blue-400">
              My Projects
            </h1>
            {projectsLoading ? (
              <div className="text-blue-300 text-lg">Loading projects...</div>
            ) : projectsError ? (
              <div className="text-red-400 text-lg">{projectsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-[#232a34] rounded-2xl shadow-lg border border-blue-500/10">
                  <thead>
                    <tr className="text-blue-300 text-lg">
                      <th className="p-4 text-left">Project Name</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Applicants</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj) => (
                      <tr
                        key={proj._id}
                        className="border-t border-blue-500/10 hover:bg-blue-500/5 transition"
                      >
                        <td className="p-4 font-semibold text-white">
                          {proj.project_Title ||
                            proj.Project_Title ||
                            proj.Project_Description ||
                            "Untitled"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              statusColors[
                                proj.status || proj.Project_Status
                              ] || "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {proj.status || proj.Project_Status || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-blue-300">
                          {proj.bids
                            ? proj.bids.length
                            : proj.Project_Number_Of_Bids || 0}
                        </td>
                        <td className="p-4 flex gap-2">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"
                            onClick={() => setSelectedProject(proj)}
                          >
                            <FaUsers /> View
                          </button>
                          <Link to={`/editproject/${proj._id}`}>
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1">
                              <FaEdit /> Edit
                            </button>
                          </Link>

                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"
                            onClick={() => handleDelteProject(proj._id)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedProject && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-2xl border border-blue-500/20 shadow-2xl relative">
                  <h2 className="text-2xl font-bold mb-6 text-blue-400 text-center">
                    Applicants for{" "}
                    {selectedProject.project_Title ||
                      selectedProject.Project_Title}
                  </h2>
                  <ul className="space-y-8 max-h-[70vh] overflow-y-auto">
                    {selectedProject.bids && selectedProject.bids.length > 0 ? (
                      selectedProject.bids.map((a, idx) => (
                        <li
                          key={a._id || idx}
                          className="bg-[#181b23] rounded-xl p-6 flex flex-col md:flex-row gap-6 shadow border border-blue-500/10"
                        >
                          {/* Profile Picture & Social */}
                          <div className="flex-shrink-0 flex flex-col items-center md:items-start w-40">
                            <img
                              src={
                                a.bidderProfile?.user_profile_cover_photo
                                  ? a.bidderProfile.user_profile_cover_photo
                                  : "https://ui-avatars.com/api/?name=" +
                                    (a.bidderProfile?.username || "User")
                              }
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 mb-3"
                            />
                            <span className="text-xs text-gray-400 mb-2">
                              {a.bidderProfile?.user_profile_location ||
                                "Unknown"}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {a.bidderProfile?.user_profile_github && (
                                <a
                                  href={a.bidderProfile.user_profile_github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-gray-800 px-2 py-1 rounded hover:underline"
                                >
                                  GitHub
                                </a>
                              )}
                              {a.bidderProfile?.user_profile_linkedIn && (
                                <a
                                  href={a.bidderProfile.user_profile_linkedIn}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-blue-800 px-2 py-1 rounded hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {a.bidderProfile?.user_profile_website && (
                                <a
                                  href={a.bidderProfile.user_profile_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-green-800 px-2 py-1 rounded hover:underline"
                                >
                                  Website
                                </a>
                              )}
                              {a.bidderProfile?.user_profile_instagram && (
                                <a
                                  href={a.bidderProfile.user_profile_instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white bg-pink-800 px-2 py-1 rounded hover:underline"
                                >
                                  Instagram
                                </a>
                              )}
                            </div>
                          </div>
                          {/* Profile & Bid Details */}
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Username & Status */}
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className="text-xl font-bold text-white">
                                {a.bidderProfile?.username || "Unknown"}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded font-semibold ${
                                  statusColors[a.bid_status] ||
                                  "bg-gray-700 text-gray-300"
                                }`}
                              >
                                {a.bid_status || "Applied"}
                              </span>
                            </div>
                            {/* Profile Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Email:{" "}
                                </span>
                                <span className="text-gray-200 break-all">
                                  {a.bidderProfile?.user_profile_email || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Profile Created:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bidderProfile?.user_profile_created_at
                                    ? new Date(
                                        a.bidderProfile.user_profile_created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Experience:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.year_of_experience || "N/A"} yrs
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Hours/Week:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.hours_avilable_per_week || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Projects Done:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bidderProfile?.user_completed_projects ??
                                    "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Contributions:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bidderProfile?.user_project_contribution ??
                                    "N/A"}
                                </span>
                              </div>
                            </div>
                            {/* Skills & Bio */}
                            <div>
                              <span className="font-semibold text-gray-300">
                                Skills:{" "}
                              </span>
                              <span className="text-blue-200">
                                {a.bidderProfile?.user_profile_skills?.join(
                                  ", "
                                ) || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-300">
                                Bio:{" "}
                              </span>
                              <span className="text-gray-200">
                                {a.bidderProfile?.user_profile_bio || "N/A"}
                              </span>
                            </div>
                            {/* Bid Proposal */}
                            <div className="mt-2 p-4 rounded-xl bg-[#232a34] border border-blue-500/10">
                              <div className="flex flex-wrap gap-4 items-center mb-2">
                                <span className="font-semibold text-yellow-300">
                                  Bid Amount:{" "}
                                  <span className="text-white">
                                    ₹{a.bid_amount}
                                  </span>
                                </span>
                                <span className="font-semibold text-blue-300">
                                  Proposal Date:{" "}
                                  <span className="text-white">
                                    {a.created_at
                                      ? new Date(
                                          a.created_at
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-300">
                                  Proposal Description:{" "}
                                </span>
                                <span className="text-gray-200">
                                  {a.bid_description}
                                </span>
                              </div>
                              {/* Extra: Show skills from bid if present */}
                              {a.skills && a.skills.length > 0 && (
                                <div className="mt-2">
                                  <span className="font-semibold text-gray-300">
                                    Bid Skills:{" "}
                                  </span>
                                  <span className="text-blue-200">
                                    {a.skills.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No applicants yet.</li>
                    )}
                  </ul>
                  <button
                    className="mt-8 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition w-full"
                    onClick={() => setSelectedProject(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {view === "applicants" && (
          <section>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-blue-400">
              Applicants
            </h1>
            {applicantsLoading ? (
              <div className="text-blue-300 text-lg">Loading applicants...</div>
            ) : applicantsError ? (
              <div className="text-red-400 text-lg">{applicantsError}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {applicants.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-8 bg-[#232a34] rounded-xl shadow">
                    No applicants found.
                  </div>
                ) : (
                  applicants.map((app) => (
                    <div
                      key={app._id}
                      className="bg-[#232a34] rounded-2xl shadow-lg border border-blue-500/10 p-6 flex flex-col gap-3 transition hover:scale-[1.02] hover:border-blue-400"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                            User ID
                          </div>
                          <div className="text-base font-semibold text-white break-all">
                            {app.user_id || "N/A"}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            statusColors[app.bid_status] ||
                            "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {app.bid_status || "Applied"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-blue-300">
                        <span className="font-semibold">Project:</span>
                        {app.project_id?.project_Title || "N/A"}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-yellow-200">
                        <span className="font-semibold">Bid:</span>₹
                        {app.bid_amount}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-200">
                        <span className="font-semibold">Bid Desc:</span>
                        {app.bid_description || "N/A"}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-blue-200">
                        <span className="font-semibold">Year Exp:</span>
                        {app.year_of_experience || "N/A"}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-blue-200">
                        <span className="font-semibold">Hours/Week:</span>
                        {app.hours_avilable_per_week || "N/A"}
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs text-blue-200">
                        <span className="font-semibold">Skills:</span>
                        {app.skills?.length
                          ? app.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded"
                              >
                                {skill}
                              </span>
                            ))
                          : "N/A"}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs">
                          <FaUserCheck /> Accept
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1 text-xs">
                          <FaUserTimes /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
