import Navbar from "../components/NavBar";
import axios from "axios";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import userProjectsApi from "../utils/userProjectsApi.js";
import ProjectStatsSection from "../components/ProjectStatsSection.jsx";
import UserProjectCard from "../components/UserProjectCard.jsx";
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
  FaSync,
} from "react-icons/fa";

import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Professional Skill Card Component
const SkillCard = React.memo(({ skill, getSkillIcon }) => {
  const SkillIcon = getSkillIcon(skill.name);

  return (
    <motion.div
      className="group relative bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-xl border border-gray-700/50 p-5 hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Skill Icon and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all duration-300">
          <SkillIcon className="text-xl text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {skill.name}
          </h3>
          <span className="text-gray-400 text-sm">{skill.category}</span>
        </div>
      </div>

      {/* Proficiency Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              skill.proficiency === "Experienced"
                ? "bg-green-400"
                : skill.proficiency === "Intermediate"
                ? "bg-yellow-400"
                : "bg-purple-400"
            }`}
          ></div>
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              skill.proficiency === "Experienced"
                ? "bg-green-500/20 text-green-400"
                : skill.proficiency === "Intermediate"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {skill.proficiency}
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
          {skill.projects} projects
        </span>
      </div>
    </motion.div>
  );
});

// Optimized Contribution Square Component
const ContributionSquare = React.memo(
  ({ contributionLevel, contributionCount, date }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="w-4 h-4 rounded-md cursor-pointer group relative border border-gray-700/40 transition-transform duration-200 hover:scale-110"
        style={{
          backgroundColor:
            contributionLevel === 0
              ? "#374151"
              : contributionLevel === 1
              ? "#0e4429"
              : contributionLevel === 2
              ? "#006d32"
              : contributionLevel === 3
              ? "#26a641"
              : "#39d353",
          boxShadow:
            contributionLevel > 0 ? "0 2px 6px rgba(0, 0, 0, 0.3)" : "none",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Optimized Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl whitespace-nowrap z-20 border border-gray-700/50 shadow-2xl">
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
        )}
      </div>
    );
  }
);

// Lazy Skills Section Component
const SkillsSection = React.memo(
  ({
    skills,
    getSkillIcon,
    contributionData,
    selectedTimePeriod,
    setSelectedTimePeriod,
    showAnalytics,
    setShowAnalytics,
    isRealTimeEnabled,
    setIsRealTimeEnabled,
    analyticsData,
    getRealTimeData,
    fetchUserProfile,
    loading,
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      // Simulate loading time for better UX
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) {
      return (
        <div className="space-y-8">
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Skills by Domain Section */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Skills by Domain
            </h3>
            <p className="text-gray-400">
              Organized expertise across different technology areas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Frontend Development */}
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FaHtml5 className="text-xl text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Frontend</h4>
                  <p className="text-blue-400 text-sm">
                    {
                      skills.filter((skill) => skill.category === "Frontend")
                        .length
                    }{" "}
                    technologies
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {skills
                  .filter((skill) => skill.category === "Frontend")
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-sm">
                        {skill.name}
                      </span>
                      <span className="text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-full">
                        {skill.experience}y
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Backend Development */}
            <div className="bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-xl border border-green-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaNodeJs className="text-xl text-green-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Backend</h4>
                  <p className="text-green-400 text-sm">
                    {
                      skills.filter((skill) => skill.category === "Backend")
                        .length
                    }{" "}
                    technologies
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {skills
                  .filter((skill) => skill.category === "Backend")
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-sm">
                        {skill.name}
                      </span>
                      <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                        {skill.experience}y
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* DevOps & Tools */}
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-xl border border-purple-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaDocker className="text-xl text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">DevOps</h4>
                  <p className="text-purple-400 text-sm">
                    {
                      skills.filter((skill) => skill.category === "DevOps")
                        .length
                    }{" "}
                    technologies
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {skills
                  .filter((skill) => skill.category === "DevOps")
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-sm">
                        {skill.name}
                      </span>
                      <span className="text-purple-400 text-xs bg-purple-500/10 px-2 py-1 rounded-full">
                        {skill.experience}y
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Skills & Technologies Section */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">
                Technical Skills & Expertise
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Comprehensive knowledge across multiple technology domains with
                hands-on project experience
              </p>
            </div>
            <button
              onClick={fetchUserProfile}
              disabled={loading}
              className="p-3 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh skills data"
            >
              <FaSync className={`text-lg ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Skills Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {skills.length}
              </div>
              <div className="text-gray-300 font-medium">Technologies</div>
              <div className="text-gray-500 text-sm mt-1">Mastered</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {
                  skills.filter((skill) => skill.proficiency === "Experienced")
                    .length
                }
              </div>
              <div className="text-gray-300 font-medium">Experienced</div>
              <div className="text-gray-500 text-sm mt-1">3+ Years</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-xl border border-yellow-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {
                  skills.filter((skill) => skill.proficiency === "Intermediate")
                    .length
                }
              </div>
              <div className="text-gray-300 font-medium">Intermediate</div>
              <div className="text-gray-500 text-sm mt-1">1-2 Years</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {
                  skills.filter((skill) => skill.proficiency === "Beginner")
                    .length
                }
              </div>
              <div className="text-gray-300 font-medium">Beginner</div>
              <div className="text-gray-500 text-sm mt-1">Under 1 Year</div>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <SkillCard skill={skill} getSkillIcon={getSkillIcon} />
              </motion.div>
            ))}
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
                <div className="text-2xl font-bold text-green-400">1,247</div>
                <div className="text-gray-400 text-sm">Total Contributions</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">156</div>
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
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((day, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-400 text-right pr-2 h-4 leading-4 mb-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Contribution Squares Container */}
                <div className="flex-1">
                  <div className="grid grid-cols-52 gap-1.5">
                    {contributionData.map((item, i) => (
                      <ContributionSquare
                        key={i}
                        contributionLevel={item.contributionLevel}
                        contributionCount={item.contributionCount}
                        date={item.date}
                      />
                    ))}
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
                  <div className="text-lg font-bold text-green-400">156</div>
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
                  <div className="text-lg font-bold text-blue-400">23</div>
                  <div className="text-gray-400 text-sm">Current Streak</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaTrophy className="text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">45</div>
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
                  <div className="text-lg font-bold text-orange-400">89%</div>
                  <div className="text-gray-400 text-sm">Consistency</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Analytics Dashboard */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
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
                    isRealTimeEnabled ? "bg-white animate-pulse" : "bg-gray-300"
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
                    <div className="text-gray-400 text-sm">Average Rating</div>
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
                    <div className="text-gray-400 text-sm">Lines of Code</div>
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
                      {Object.entries(getRealTimeData().skillGrowth).map(
                        ([skill, growth], index) => (
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
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

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

  // User Projects State
  const [userProjects, setUserProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Function to fetch user profile - defined early to avoid scope issues
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
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
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Function to fetch user projects
  const fetchUserProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const response = await userProjectsApi.getAssignedProjects();
      setUserProjects(response.projects || []);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error fetching user projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Function to fetch project statistics
  const fetchProjectStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await userProjectsApi.getProjectStats();
      setProjectStats(response.stats || {});
    } catch (error) {
      console.error("Error fetching project stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Function to handle tab changes and refresh data when needed
  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      // Refresh project data when switching to projects tab
      if (tabId === "projects") {
        fetchUserProjects();
        fetchProjectStats();
      }
    },
    [fetchUserProjects, fetchProjectStats]
  );

  // Refresh profile data when component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      fetchUserProfile();
      // Also refresh project data when window comes into focus
      fetchUserProjects();
      fetchProjectStats();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchUserProfile, fetchUserProjects, fetchProjectStats]);

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

  // Fetch user projects and stats when component mounts
  useEffect(() => {
    fetchUserProjects();
    fetchProjectStats();
  }, [fetchUserProjects, fetchProjectStats]);

  // Auto-refresh project data every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "projects") {
        fetchUserProjects();
        fetchProjectStats();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [activeTab, fetchUserProjects, fetchProjectStats]);

  // State for recent projects display
  const [showAllRecentProjects, setShowAllRecentProjects] = useState(false);
  
  // Calculate total completed tasks (contributions) and completed projects
  const userStats = useMemo(() => {
    if (userProjects && userProjects.length > 0) {
      const totalCompletedTasks = userProjects.reduce((sum, project) => {
        return sum + (project.completedTasks || 0);
      }, 0);
      
      const completedProjects = userProjects.filter(project => 
        project.projectStatus === "Completed"
      ).length;
      
      return {
        totalContributions: totalCompletedTasks,
        completedProjects: completedProjects
      };
    }
    
    return {
      totalContributions: 0,
      completedProjects: 0
    };
  }, [userProjects]);

  // Get recent projects from userProjects (real data)
  const recentProjects = useMemo(() => {
    if (userProjects && userProjects.length > 0) {
      // Sort by assigned date (most recent first) and take first 4 or all if showAllRecentProjects is true
      const sortedProjects = userProjects
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))
        .slice(0, showAllRecentProjects ? userProjects.length : 4);
      
      return sortedProjects.map(project => ({
        _id: project._id,
        name: project.projectTitle,
        date: new Date(project.assignedDate).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        description: project.projectDescription,
        tech: project.techStack ? project.techStack.split(',').map(tech => tech.trim()) : [],
        status: project.projectStatus?.toLowerCase() || 'pending',
        bidAmount: project.bidAmount,
        progressPercentage: project.progressPercentage,
        totalTasks: project.totalTasks,
        completedTasks: project.completedTasks
      }));
    }
    
    // Fallback to empty array if no projects
    return [];
  }, [userProjects, showAllRecentProjects]);

  // Optimized skills data - memoized to prevent unnecessary re-renders
  const skills = useMemo(() => {
    if (
      userProfile.user_profile_skills &&
      userProfile.user_profile_skills.length > 0
    ) {
      return userProfile.user_profile_skills.map((skill) => {
        // Handle both string and object skill formats
        if (typeof skill === "string") {
          return {
            name: skill,
            category: "Programming",
            experience: 1, // Default experience
            projects: 1, // Default projects
            proficiency: "Beginner", // Default proficiency
          };
        } else if (skill && typeof skill === "object") {
          return {
            name: skill.skillName || skill.name || "Unknown Skill",
            category: skill.category || "Programming",
            experience: skill.experienceYears || skill.experience || 1,
            projects: skill.projectsCount || skill.projects || 1,
            proficiency: skill.proficiency || "Beginner", // Include proficiency from database
          };
        }
        return {
          name: "Unknown Skill",
          category: "Programming",
          experience: 1,
          projects: 1,
          proficiency: "Beginner",
        };
      });
    }

    // Fallback skills if no skills are defined
    return [
      {
        name: "JavaScript",
        category: "Frontend",
        experience: 1,
        projects: 1,
        proficiency: "Beginner",
      },
      {
        name: "React",
        category: "Frontend",
        experience: 1,
        projects: 1,
        proficiency: "Beginner",
      },
      {
        name: "Node.js",
        category: "Backend",
        experience: 1,
        projects: 1,
        proficiency: "Beginner",
      },
    ];
  }, [userProfile.user_profile_skills]);

  // Optimized skill functions with useCallback
  const getSkillIcon = useCallback((skillName) => {
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
  }, []);

  // Get skill level label
  const getSkillLevel = useCallback((proficiency) => {
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
  }, []);

  // Optimized contribution data - memoized to prevent recalculation
  const contributionData = useMemo(() => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1); // Start of year

    // Generate data for 52 weeks (364 days) instead of 365 for better performance
    for (let i = 0; i < 364; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isRecent = i >= 334; // Last 30 days

      let contributionLevel;
      if (isRecent) {
        contributionLevel =
          Math.random() > 0.3
            ? Math.floor(Math.random() * 3) + 2
            : Math.floor(Math.random() * 2);
      } else if (isWeekend) {
        contributionLevel =
          Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
      } else {
        contributionLevel =
          Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 1 : 0;
      }

      const contributionCount =
        contributionLevel === 0 ? 0 : Math.floor(Math.random() * 8) + 1;

      data.push({
        date,
        contributionLevel,
        contributionCount,
        index: i,
      });
    }

    return data;
  }, []);

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
                  <div className="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10 overflow-hidden">
                    {userProfile.user_profile_avatar ? (
                      <img
                        src={`http://localhost:8000${userProfile.user_profile_avatar}`}
                        alt={`${
                          userProfile.username?.username || "User"
                        } avatar`}
                        className="h-28 w-28 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-28 w-28 bg-[#1a1a1a] rounded-full flex items-center justify-center ${
                        userProfile.user_profile_avatar ? "hidden" : ""
                      }`}
                    >
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
                          <span>
                            {userProfile.user_profile_location ||
                              "Location not set"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaCalendar />
                          <span>
                            Member since{" "}
                            {userProfile.username?.createdAt
                              ? new Date(
                                  userProfile.username.createdAt
                                ).getFullYear()
                              : userProfile.user_profile_created_at
                              ? new Date(
                                  userProfile.user_profile_created_at
                                ).getFullYear()
                              : "2024"}
                          </span>
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
              {lastRefreshTime && (
                <div className="col-span-2 text-center mb-2">
                  <p className="text-xs text-gray-500">
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </p>
                </div>
              )}
              <motion.div
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {loadingProjects ? (
                    <div className="animate-pulse bg-blue-400/20 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    userStats.totalContributions
                  )}
                </div>
                <div className="text-gray-300">Contributions</div>
                <div className="text-gray-500 text-xs mt-1">Completed Tasks</div>
                {!loadingProjects && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs">Live Data</span>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {loadingProjects ? (
                    <div className="animate-pulse bg-green-400/20 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    userStats.completedProjects
                  )}
                </div>
                <div className="text-gray-300">Completed Projects</div>
                <div className="text-gray-500 text-xs mt-1">Successfully Delivered</div>
                {!loadingProjects && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs">Live Data</span>
                  </div>
                )}
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
                    onClick={() => handleTabChange(tab.id)}
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
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <FaRocket className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Recent Projects
                        </h2>
                        <p className="text-gray-400 text-sm">
                          Your recently participated projects
                        </p>
                      </div>
                    </div>
                    {userProjects.length > 4 && (
                      <button
                        onClick={() => setShowAllRecentProjects(!showAllRecentProjects)}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 rounded-lg text-sm font-medium"
                      >
                        {showAllRecentProjects ? "Show Less" : `See More (${userProjects.length - 4})`}
                      </button>
                    )}
                  </div>

                  {recentProjects.length > 0 ? (
                    <div className="space-y-4">
                      {recentProjects.map((project, index) => (
                        <motion.div
                          key={project._id || index}
                          className="bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
                          whileHover={{ x: 5, scale: 1.01 }}
                          onClick={() => {
                            // Handle project click - could open modal or navigate to details
                            console.log("Recent project clicked:", project);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg font-semibold text-white">
                                  {project.name}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    project.status === "completed"
                                      ? "bg-green-500/20 text-green-400"
                                      : project.status === "in progress"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {project.status === "completed"
                                    ? "Completed"
                                    : project.status === "in progress"
                                    ? "In Progress"
                                    : "Pending"}
                                </span>
                                {project.bidAmount && (
                                  <span className="text-green-400 text-sm font-semibold">
                                    ${project.bidAmount}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-gray-400 text-sm mb-3" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {project.description}
                              </p>
                              
                              {/* Progress Bar */}
                              {project.totalTasks > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${project.progressPercentage || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                  {project.tech?.slice(0, 3).map((tech, techIndex) => (
                                    <span
                                      key={techIndex}
                                      className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                  {project.tech?.length > 3 && (
                                    <span className="text-gray-500 text-xs">
                                      +{project.tech.length - 3} more
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-500 text-sm">
                                  {project.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaRocket className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No recent projects yet
                      </h3>
                      <p className="text-gray-400">
                        Start bidding on projects to see them here!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Project Statistics Section */}
                <ProjectStatsSection
                  stats={projectStats}
                  loading={loadingStats}
                />

                {/* Project Filter Tabs */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        My Projects
                      </h2>
                      {lastRefreshTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last updated: {lastRefreshTime.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {["all", "completed", "in-progress", "pending"].map(
                          (filter) => (
                            <button
                              key={filter}
                              onClick={() => setSelectedProjectFilter(filter)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                selectedProjectFilter === filter
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                              }`}
                            >
                              {filter === "all"
                                ? "All"
                                : filter === "completed"
                                ? "Completed"
                                : filter === "in-progress"
                                ? "In Progress"
                                : "Pending"}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        onClick={() => {
                          fetchUserProjects();
                          fetchProjectStats();
                        }}
                        disabled={loadingProjects || loadingStats}
                        className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh project data"
                      >
                        <FaSync
                          className={`text-lg ${
                            loadingProjects || loadingStats
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {loadingProjects ? (
                    <div className="text-gray-400 text-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      Loading projects...
                    </div>
                  ) : userProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userProjects
                        .filter((project) => {
                          if (selectedProjectFilter === "all") return true;
                          if (selectedProjectFilter === "completed")
                            return project.projectStatus === "Completed";
                          if (selectedProjectFilter === "in-progress")
                            return project.projectStatus === "In Progress";
                          if (selectedProjectFilter === "pending")
                            return project.projectStatus === "Pending";
                          return true;
                        })
                        .map((project, index) => (
                          <UserProjectCard
                            key={project._id}
                            project={project}
                            onClick={(project) => {
                              // Handle project click - could open modal or navigate to details
                              console.log("Project clicked:", project);
                            }}
                          />
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
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No projects yet
                      </h3>
                      <p className="text-gray-400">
                        Start bidding on projects to see them here!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "skills" && (
              <SkillsSection
                skills={skills}
                getSkillIcon={getSkillIcon}
                contributionData={contributionData}
                selectedTimePeriod={selectedTimePeriod}
                setSelectedTimePeriod={setSelectedTimePeriod}
                showAnalytics={showAnalytics}
                setShowAnalytics={setShowAnalytics}
                isRealTimeEnabled={isRealTimeEnabled}
                setIsRealTimeEnabled={setIsRealTimeEnabled}
                analyticsData={analyticsData}
                getRealTimeData={getRealTimeData}
                fetchUserProfile={fetchUserProfile}
                loading={loading}
              />
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
