/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { motion } from "framer-motion";

const ProjectCard = memo(({ project }) => {
  if (!project || Object.keys(project).length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto my-4"
      >
        <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-center">No project data available</p>
        </div>
      </motion.div>
    );
  }

  const [showFull, setShowFull] = useState(false);

  // Memoized calculations
  const projectData = useMemo(() => {
    const wordLimit = 70;
    const words = project.Project_Description
      ? project.Project_Description.split(" ")
      : [];
    const shortDescription =
      words.length > wordLimit
        ? words.slice(0, wordLimit).join(" ") + "..."
        : project.Project_Description || "No description available.";

    // Calculate project duration properly
    const calculateDurationInMonths = (storedDate) => {
      if (!storedDate) return null;
      
      const currentDate = new Date();
      const projectDate = new Date(storedDate);
      
      // Check if the date is valid
      if (isNaN(projectDate.getTime())) return null;
      
      const timeDiff = projectDate.getTime() - currentDate.getTime();
      const monthsDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 30));
      
      return monthsDiff;
    };

    const durationInMonths = calculateDurationInMonths(project.project_duration);
    
    // Format budget with proper Indian currency formatting
    const formatBudget = (budget) => {
      if (!budget) return "N/A";
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(budget);
    };

    return {
      shortDescription,
      fullDescription: project.Project_Description || "No description available.",
      durationInMonths,
      formattedBudget: formatBudget(project.project_starting_bid),
      techStack: project.Project_tech_stack ? project.Project_tech_stack.split(",").map(tech => tech.trim()) : [],
      title: project.project_Title || "Untitled Project",
      bidCount: project.Project_Number_Of_Bids || 0
    };
  }, [project]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const techStackVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="w-full h-full"
    >
      <div className="relative bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] text-white rounded-xl overflow-hidden border border-[#00A8E8]/20 shadow-lg shadow-[#00A8E8]/10 transition-all duration-300 hover:shadow-[#00A8E8]/20 hover:border-[#00A8E8]/40">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A8E8] to-[#0062E6]"></div>

        {/* Content container */}
        <div className="p-4 lg:p-6 xl:p-8">
          {/* Header section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6">
            <motion.h1 
              className="text-xl lg:text-2xl xl:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6] uppercase tracking-wide truncate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {projectData.title}
            </motion.h1>
            <motion.div 
              className="flex items-center mt-2 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium border border-green-500/30">
                Active Project
              </span>
            </motion.div>
          </div>

          {/* Project description */}
          <motion.div 
            className="mb-4 lg:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-base lg:text-lg font-semibold text-gray-300 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Project Overview
            </h2>
            <p className="text-gray-400 text-sm lg:text-base leading-relaxed">
              {showFull ? projectData.fullDescription : projectData.shortDescription}
            </p>
            {projectData.fullDescription.length > 70 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-2 text-[#00A8E8] text-sm font-medium hover:text-[#0062E6] focus:outline-none transition-colors flex items-center"
                onClick={() => setShowFull(!showFull)}
              >
                {showFull ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Read More
                  </>
                )}
              </motion.button>
            )}
          </motion.div>

          {/* Tech stack */}
          <motion.div 
            className="mb-4 lg:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-base lg:text-lg font-semibold text-gray-300 mb-2 lg:mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {projectData.techStack.length > 0 ? (
                projectData.techStack.map((tech, index) => (
                  <motion.span
                    key={index}
                    custom={index}
                    variants={techStackVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1 bg-[#2A2A2A] text-[#00A8E8] text-sm rounded-md border border-[#00A8E8]/30 hover:border-[#00A8E8] hover:bg-[#00A8E8]/10 transition-all duration-300"
                  >
                    {tech}
                  </motion.span>
                ))
              ) : (
                <span className="text-gray-400">No tech stack available</span>
              )}
            </div>
          </motion.div>

          {/* Project details grid */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-[#2A2A2A] to-[#333] p-3 lg:p-4 rounded-lg border border-[#444] hover:border-[#00A8E8]/30 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-gray-400 text-xs uppercase font-medium mb-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Starting Bid
              </h3>
              <p className="text-lg lg:text-xl font-bold text-white">{projectData.formattedBudget}</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-[#2A2A2A] to-[#333] p-3 lg:p-4 rounded-lg border border-[#444] hover:border-[#00A8E8]/30 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-gray-400 text-xs uppercase font-medium mb-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Duration
              </h3>
              <p className="text-lg lg:text-xl font-bold text-white">
                {projectData.durationInMonths !== null
                  ? projectData.durationInMonths > 0
                    ? `${projectData.durationInMonths} months`
                    : "Project has ended"
                  : "N/A"}
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-[#2A2A2A] to-[#333] p-3 lg:p-4 rounded-lg border border-[#444] hover:border-[#00A8E8]/30 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-gray-400 text-xs uppercase font-medium mb-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Active Bidders
              </h3>
              <p className="text-lg lg:text-xl font-bold text-white">{projectData.bidCount}</p>
            </motion.div>

            {/* Bonus Pool Card */}
            <motion.div 
              className="bg-gradient-to-br from-[#2A2A2A] to-[#333] p-3 lg:p-4 rounded-lg border border-[#444] hover:border-[#00A8E8]/30 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-gray-400 text-xs uppercase font-medium mb-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Bonus Pool
              </h3>
              <p className="text-lg lg:text-xl font-bold text-white">
                {project.bonus_pool_amount && project.bonus_pool_contributors 
                  ? `₹${(parseInt(project.bonus_pool_amount) * parseInt(project.bonus_pool_contributors)).toLocaleString('en-IN')}`
                  : "₹0"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {project.bonus_pool_amount && project.bonus_pool_contributors 
                  ? `₹${project.bonus_pool_amount}/contributor`
                  : "Not set"}
              </p>
            </motion.div>
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to={`/bidingPage/${project._id}`} className="block">
              <motion.button 
                className="w-full py-3 px-6 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-[#00A8E8]/20 hover:shadow-[#00A8E8]/40 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center">
                  Participate Now
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;