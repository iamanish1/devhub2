import { useState } from "react";
import { Link } from "react-router-dom";

const ProjectCard = () => {
  const fullDescription = `
    Overview: Bug Hunt Arena is a platform where developers submit projects for testing, 
    and testers compete to find and report bugs. Our AI-powered system validates bug reports, 
    assigns points based on severity, and ranks testers on a leaderboard. 
    This makes bug hunting engaging while helping developers improve their software quality. 
    Tech Stack: Frontend: React, Tailwind CSS. Backend: Node.js, MongoDB. 
    Additional Tools: Judge0 for in-app code execution, Firebase for real-time updates.
    Features: AI-Verified Bug Reports - AI assists in validating and categorizing reported bugs.
    Gamification & Leaderboard - Earn points, rank up, and get rewards for valid bug discoveries.
    Live Code Execution - Inbuilt compiler for testing vulnerabilities in real time.
    Looking For: We're looking for beta testers, contributors, and security experts to refine 
    the bug detection system and improve AI-assisted validation.
  `;

  const wordLimit = 70; // Set word limit
  const words = fullDescription.split(" ");
  const shortDescription = words.slice(0, wordLimit).join(" ") + "...";

  const [showFull, setShowFull] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const technologies = ["Python", "TensorFlow", "Rasa"];

  return (
    <div className="max-w-3xl mx-auto my-4">
      <div className="relative bg-gray-900 text-white rounded-xl overflow-hidden border border-cyan-500 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/40">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
        
        {/* Content container */}
        <div className="p-6 md:p-8">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-wide">
              Bug Hunt Arena
            </h1>
            <div className="flex items-center mt-2 md:mt-0">
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
                Active Project
              </span>
            </div>
          </div>
          
          {/* Project description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Project Overview</h2>
            <div className="relative">
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {showFull ? fullDescription : shortDescription}
              </p>
              <button
                className="mt-2 text-cyan-400 text-sm font-medium hover:text-cyan-300 focus:outline-none transition-colors flex items-center"
                onClick={() => setShowFull(!showFull)}
              >
                {showFull ? "Show Less" : "Read More"}
                <svg className={`w-4 h-4 ml-1 transition-transform ${showFull ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Tech stack */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-800 text-cyan-400 text-sm rounded-md border border-cyan-500/30 hover:border-cyan-400 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          
          {/* Project details grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-medium">Budget</h3>
              <p className="text-xl font-bold text-white">₹15,000</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-medium">Duration</h3>
              <p className="text-xl font-bold text-white">12 months</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-medium">Active Bidders</h3>
              <p className="text-xl font-bold text-white">10</p>
            </div>
          </div>
          
          {/* CTA button */}
          <Link to="/bidingPage" className="block">
            <button 
              className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg hover:shadow-cyan-500/50 focus:outline-none"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="flex items-center justify-center">
                <span>Bid Now</span>
                <svg 
                  className={`w-5 h-5 ml-2 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
