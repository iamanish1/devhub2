import { useState } from "react";
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

const recentActivity = [
  {
    type: "project",
    text: "New project 'AI Chatbot' created",
    time: "2 hours ago",
  },
  {
    type: "applicant",
    text: "Anish applied for 'AI Chatbot'",
    time: "1 hour ago",
  },
  {
    type: "status",
    text: "Riya was accepted for 'Bug Tracker'",
    time: "30 minutes ago",
  },
];

const AdminPage = () => {
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);

  // Dashboard stats
  const totalProjects = dummyProjects.length;
  const openProjects = dummyProjects.filter((p) => p.status === "Open").length;
  const closedProjects = dummyProjects.filter(
    (p) => p.status === "Closed"
  ).length;
  const totalApplicants = dummyProjects.reduce(
    (sum, p) => sum + p.applicants,
    0
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e]">
         <Navbar/>
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
                  {totalProjects}
                </div>
                <div className="mt-2 text-gray-300">Total Projects</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/60 to-green-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaCheckCircle className="text-4xl text-green-400 mb-3" />
                <div className="text-3xl font-extrabold text-green-400">
                  {openProjects}
                </div>
                <div className="mt-2 text-gray-300">Open Projects</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/60 to-red-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaTimesCircle className="text-4xl text-red-400 mb-3" />
                <div className="text-3xl font-extrabold text-red-400">
                  {closedProjects}
                </div>
                <div className="mt-2 text-gray-300">Closed Projects</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/60 to-purple-700/40 rounded-2xl shadow-lg p-8 text-center border border-blue-500/10 flex flex-col items-center">
                <FaUsers className="text-4xl text-purple-400 mb-3" />
                <div className="text-3xl font-extrabold text-purple-400">
                  {totalApplicants}
                </div>
                <div className="mt-2 text-gray-300">Total Applicants</div>
              </div>
            </div>
            <div className="bg-[#232a34] rounded-2xl shadow-lg p-8 border border-blue-500/10">
              <h2 className="text-2xl font-bold text-blue-300 mb-4">
                Recent Activity
              </h2>
              <ul className="divide-y divide-blue-500/10">
                {recentActivity.map((activity, idx) => (
                  <li key={idx} className="py-3 flex items-center gap-4">
                    {activity.type === "project" && (
                      <FaProjectDiagram className="text-blue-400 text-xl" />
                    )}
                    {activity.type === "applicant" && (
                      <FaUsers className="text-purple-400 text-xl" />
                    )}
                    {activity.type === "status" && (
                      <FaCheckCircle className="text-green-400 text-xl" />
                    )}
                    <span className="text-white">{activity.text}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {activity.time}
                    </span>
                  </li>
                ))}
              </ul>
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
