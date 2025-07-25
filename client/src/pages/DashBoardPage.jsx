/* eslint-disable no-unused-vars */
import Navbar from "../components/NavBar";
import ProjectCard from "../components/ProjectCard";
import { useState, useEffect } from "react";
import axios from "axios";

const DashboardPage = () => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/project/getlistproject"
        );
        setProjects(response.data.project || []);
        setLoading(false);
        console.log("Projects fetched successfully:", response.data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "An error occurred while fetching projects."
        );
        setLoading(false);
      }
    };
    console.log("Fetching projects...");
    fetchProjects();
  }, []);
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
              <select className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors">
                <option>All</option>
                <option>MERN Stack</option>
                <option>MEAN Stack</option>
                <option>MEVN Stack</option>
                <option>Next.js</option>
                <option>NestJS</option>
                <option>Django</option>
                <option>Flask</option>
                <option>Spring Boot</option>
                <option>ASP.NET</option>
                <option>React Native</option>
                <option>Flutter</option>
                <option>Swift</option>
                <option>Kotlin</option>
                <option>TensorFlow</option>
                <option>PyTorch</option>
                <option>Apache Spark</option>
                <option>Solidity</option>
                <option>Rust</option>
                <option>Docker</option>
                <option>Kubernetes</option>
                <option>AWS</option>
                <option>GCP</option>
                <option>MySQL</option>
                <option>MongoDB</option>
                <option>PostgreSQL</option>
                <option>Firebase</option>
                <option>Redis</option>
                <option>Unity</option>
                <option>Unreal Engine</option>
                <option>IoT</option>
                <option>C++</option>
                <option>Go</option>
                <option>Rust</option>
                <option>Cybersecurity</option>
                <option>Other</option>
              </select>
            </div>

            {/* Budget Range Filter */}
            <div className="filter-group">
              <label className="block text-[#00A8E8] mb-2 font-medium">
                Starting Bid 
              </label>
              <select className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors">
                <option>Micro Budget (Below ₹500)</option>
                <option>Low Budget (₹500 - ₹2,000)</option>
                <option>Medium Budget (₹2,000 - ₹10,000)</option>
                <option>High Budget (₹10,000+)</option>
              </select>
            </div>

            {/* Based on Contributors = number of people required for project */}
            <div className="filter-group">
              <label className="block text-[#00A8E8] mb-2 font-medium">
                Number of Contributors
              </label>
              <select className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg p-3 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] focus:outline-none transition-colors">
                <option>Solo (1 Contributor)</option>
                <option>Small Team (2-4 Contributors)</option>
                <option>Medium Team (5-10 Contributors)</option>
                <option>Large Team (10+ Contributors)</option>
              </select>
            </div>

            {/* Apply Filter Button */}
            <button className="w-full bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white py-3 px-4 rounded-lg font-medium hover:from-[#00A8E8] hover:to-[#0062E6] transition-all duration-300 shadow-lg shadow-blue-500/20 mt-4">
              Apply Filters
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
