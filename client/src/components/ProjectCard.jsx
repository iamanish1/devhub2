/* eslint-disable no-unused-vars */
import Navbar from "../components/NavBar";
import ProjectCard from "../components/ProjectCard";
import { useState, useEffect } from "react";
import axios from "axios";

const DashboardPage = () => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedTechStack, setSelectedTechStack] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedContributor, setSelectedContributor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };
  const handleFilterProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append("search", searchTerm); // 🔥 Add this line
      }
      if (selectedTechStack) {
        params.append("techStack", selectedTechStack);
      }
      if (selectedBudget) {
        params.append("budget", selectedBudget);
      }
      if (selectedContributor) {
        params.append("contributor", selectedContributor);
      }
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/project/getlistproject?${params.toString()}`
      );
      console.log("Filtered projects:", response.data);
      setProjects(response.data?.projects || []);

      setLoading(false);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while filtering projects."
      );
      console.error("Error filtering projects:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const params = {
          search: searchTerm,
        };

        const response = await axios.get(
          "http://localhost:8000/api/project/getlistproject",
          { params }
        );
        console.log("Fetching with filters:", {
          search: searchTerm,
        });
        setProjects(response.data.projects || []);
        setLoading(false);
        console.log("Projects fetched:", response.data);
      } catch (error) {
        setError(error.response?.data?.message || "Error fetching projects.");
        setLoading(false);
      }
    };

    fetchProjects();
  }, [searchTerm]); // Add all your filters here

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      {/* Nav-bar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row mt-[6vmin]">
        {/* Mobile Filter Toggle */}
        <button
          onClick={toggleMobileFilter}
          className="md:hidden mx-4 mt-4 bg-[#00A8E8] text-white py-2 px-4 rounded-lg flex items-center justify-between w-full"
        >
          <span className="font-medium">Filter Projects</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Filters Sidebar */}
        <aside
          className={`${
            mobileFilterOpen ? "block" : "hidden"
          } md:block w-full md:w-[300px] bg-[#1E1E1E] p-6 md:min-h-screen overflow-auto transition-all duration-300 ease-in-out`}
        >
          {/* Filter Section Header */}
          <div className="border-b border-[#333] pb-4 mb-6">
            <h2 className="text-xl font-bold text-[#00A8E8] flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter Projects
            </h2>
          </div>

          {/* Filter Sections */}
          <div className="space-y-6">
            {/* Technology Stack Filter */}
            <div className="filter-group">
              <label className="block text-[#00A8E8] mb-2 font-medium">
                Technology Stack
              </label>
              <select
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                value={selectedTechStack}
                onChange={(e) => setSelectedTechStack(e.target.value)}
              >
                <option value="">All</option>
                <option value="MERN Stack">MERN Stack</option>
                <option value="MEAN Stack">MEAN Stack</option>
                <option value="MEVN Stack">MEVN Stack</option>
                <option value="Next.js">Next.js</option>
                <option value="NestJS">NestJS</option>
                <option value="Django">Django</option>
                <option value="Flask">Flask</option>
                <option value="Spring Boot">Spring Boot</option>
                <option value="ASP.NET">ASP.NET</option>
                <option value="React Native">React Native</option>
                <option value="Flutter">Flutter</option>
                <option value="Swift">Swift</option>
                <option value="Kotlin">Kotlin</option>
                <option value="TensorFlow">TensorFlow</option>
                <option value="PyTorch">PyTorch</option>
                <option value="Apache Spark">Apache Spark</option>
                <option value="Solidity">Solidity</option>
                <option value="Rust">Rust</option>
                <option value="Docker">Docker</option>
                <option value="Kubernetes">Kubernetes</option>
                <option value="AWS">AWS</option>
                <option value="GCP">GCP</option>
                <option value="MySQL">MySQL</option>
                <option value="MongoDB">MongoDB</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="Firebase">Firebase</option>
                <option value="Redis">Redis</option>
                <option value="Unity">Unity</option>
                <option value="Unreal Engine">Unreal Engine</option>
                <option value="IoT">IoT</option>
                <option value="C++">C++</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Budget Range Filter */}
            <div className="filter-group">
              <label className="block text-[#00A8E8] mb-2 font-medium">
                Starting Bid
              </label>
              <select
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
              >
                <option value="">All Budget</option>
                <option value="Micro_Budget">Micro Budget (Below ₹500)</option>
                <option value="Low_Budget">Low Budget (₹500 - ₹2,000)</option>
                <option value="Medium_Budget">
                  Medium Budget (₹2,000 - ₹10,000)
                </option>
                <option value="High_Budget">High Budget (₹10,000+)</option>
              </select>
            </div>

            {/* Based on Contributors = number of people required for project */}
            <div className="filter-group">
              <label className="block text-[#00A8E8] mb-2 font-medium">
                Number of Contributors
              </label>
              <select
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors"
                value={selectedContributor}
                onChange={(e) => setSelectedContributor(e.target.value)}
              >
                <option value="">All Contributors</option>
                <option value="Solo">Solo (1 Contributor)</option>
                <option value="Small_Team">
                  Small Team (2-4 Contributors)
                </option>
                <option value="Medium_Team">
                  Medium Team (5-10 Contributors)
                </option>
                <option value="Large_Team">
                  Large Team (10+ Contributors)
                </option>
              </select>
            </div>

            {/* Apply Filter Button */}
            <button
              className="w-full bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white py-3 px-4 rounded-lg font-medium hover:from-[#00A8E8] hover:to-[#0062E6] transition-all duration-300 shadow-lg shadow-blue-500/20 mt-4"
              onClick={handleFilterProjects}
            >
              Apply Filters
            </button>
            <button
              className="w-full bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white py-3 px-4 rounded-lg font-medium hover:from-[#00A8E8] hover:to-[#0062E6] transition-all duration-300 shadow-lg shadow-blue-500/20 mt-2"
              onClick={async () => {
                setSelectedTechStack("");
                setSelectedBudget("");
                setSelectedContributor("");
                setLoading(true);

                try {
                  const response = await axios.get(
                    "http://localhost:8000/api/project/getlistproject"
                  );
                  setProjects(response.data.projects || []);
                } catch (error) {
                  setError("Failed to fetch all projects.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Projects Grid Section */}
        <main className="flex-1 p-4 mt-[0vmin] md:p-6 overflow-hidden flex flex-col">
          {/* Header with search */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-0">
              <span className="text-[#00A8E8]">Explore</span> Projects
            </h1>

            {/* Search bar */}
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-[300px] bg-[#2A2A2A] border border-[#444] rounded-lg pl-10 pr-4 py-2 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          {/* Project Cards Grid */}
          <div className="project-container overflow-y-auto flex-1 w-full">
            {loading ? (
              <p>Loading projects...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : projects.length > 0 ? ( // Use 'projects' here
              <div className="flex flex-col gap-6">
                {projects.map((project, index) => (
                  <ProjectCard key={project._id} project={project} /> // Use '_id' as the key
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No projects found.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;