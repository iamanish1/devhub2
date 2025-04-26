/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";
import { Link } from "react-router-dom";

const ProjectCard = ({ project }) => {
  if (!project || Object.keys(project).length === 0) {
    return <div className="text-gray-400">No project data available</div>;
  }

  const [showFull, setShowFull] = useState(false);

  const wordLimit = 70; // Set word limit for description
  const words = project.Project_Description
    ? project.Project_Description.split(" ")
    : [];
  const shortDescription =
    words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : project.Project_Description || "No description available.";
  // Calculate project duration in months
  const calculateDurationInMonths = (storedDate) => {
    const currentDate = new Date(); // Current date
    const projectDate = new Date(storedDate); // Stored project date

    const yearsDifference =
      projectDate.getFullYear() - currentDate.getFullYear();
    const monthsDifference = projectDate.getMonth() - currentDate.getMonth();

    // Total months difference
    return yearsDifference * 12 + monthsDifference;
  };

  const projectDurationInMonths = calculateDurationInMonths(project.project_duration);
  return (
    <div className="max-w-3xl mx-auto my-4">
      <div className="relative bg-gray-900 text-white rounded-xl overflow-hidden border border-cyan-500 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/40">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>

        {/* Content container */}
        <div className="p-6 md:p-8">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-wide truncate">
              {project.project_Title || "Untitled Project"}
            </h1>
            <div className="flex items-center mt-2 md:mt-0">
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium truncate">
                Active Project
              </span>
            </div>
          </div>
          {/* Project description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">
              Project Overview
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              {showFull ? project.Project_Description : shortDescription}
            </p>
            <button
              className="mt-2 text-cyan-400 text-sm font-medium hover:text-cyan-300 focus:outline-none transition-colors"
              onClick={() => setShowFull(!showFull)}
            >
              {showFull ? "Show Less" : "Read More"}
            </button>
          </div>

          {/* Tech stack */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.Project_tech_stack ? (
                project.Project_tech_stack.split(",").map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-800 text-cyan-400 text-sm rounded-md border border-cyan-500/30 hover:border-cyan-400 transition-colors"
                  >
                    {tech.trim()}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No tech stack available</span>
              )}
            </div>
          </div>

          {/* Project details grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-medium">
                Budget
              </h3>
              <p className="text-xl font-bold text-white">
                ₹{project.Project_Bid_Amount || "N/A"}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-medium">
                Duration
              </h3>
              <p className="text-xl font-bold text-white">
                {projectDurationInMonths > 0
                  ? `${projectDurationInMonths} months`
                  : "Project has ended"}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-medium">
                Active Bidders
              </h3>
              <p className="text-xl font-bold text-white">
                {project.Project_Number_Of_Bids || "N/A"}
              </p>
            </div>
          </div>

          {/* CTA button */}
          <Link to="/bidingPage" className="block">
            <button className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg hover:shadow-cyan-500/50 focus:outline-none">
              Bid Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
