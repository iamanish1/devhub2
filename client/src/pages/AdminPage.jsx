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

// Chart.js imports
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const dummyProjects = [
  { id: 1, name: "AI Chatbot", status: "Open", applicants: 5 },
  { id: 2, name: "Bug Tracker", status: "Closed", applicants: 2 },
];

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
                  {dummyProjects.map((proj) => (
                    <tr
                      key={proj.id}
                      className="border-t border-blue-500/10 hover:bg-blue-500/5 transition"
                    >
                      <td className="p-4 font-semibold text-white">
                        {proj.name}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            statusColors[proj.status] ||
                            "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {proj.status}
                        </span>
                      </td>
                      <td className="p-4 text-blue-300">{proj.applicants}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"
                          onClick={() => setSelectedProject(proj)}
                        >
                          <FaUsers /> View
                        </button>
                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1">
                          <FaEdit /> Edit
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1">
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Applicants Modal */}
            {selectedProject && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20 shadow-xl">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Applicants for {selectedProject.name}
                  </h2>
                  <ul>
                    {dummyApplicants
                      .filter((a) => a.project === selectedProject.name)
                      .map((a) => (
                        <li
                          key={a.id}
                          className="flex justify-between items-center mb-3 bg-[#181b23] px-4 py-2 rounded-lg"
                        >
                          <span className="text-white font-medium">
                            {a.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              statusColors[a.status] ||
                              "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {a.status}
                          </span>
                        </li>
                      ))}
                  </ul>
                  <button
                    className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
                    onClick={() => setSelectedProject(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Applicants Section */}
        {view === "applicants" && (
          <section>
            <h1 className="text-4xl font-bold mb-8 text-blue-400">
              Applicants
            </h1>
            <div className="overflow-x-auto">
              <table className="w-full bg-[#232a34] rounded-2xl shadow-lg border border-blue-500/10">
                <thead>
                  <tr className="text-blue-300 text-lg">
                    <th className="p-4 text-left">Applicant Name</th>
                    <th className="p-4 text-left">Project</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyApplicants.map((app) => (
                    <tr
                      key={app.id}
                      className="border-t border-blue-500/10 hover:bg-blue-500/5 transition"
                    >
                      <td className="p-4 text-white font-medium">{app.name}</td>
                      <td className="p-4 text-blue-300">{app.project}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            statusColors[app.status] ||
                            "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1">
                          <FaUserCheck /> Accept
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1">
                          <FaUserTimes /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
