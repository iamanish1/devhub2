/* eslint-disable no-unused-vars */
import Navbar from "../components/NavBar";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const BidingPage = () => {
  const { _id } = useParams();
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(48 * 60 * 60); // 48 hours in seconds
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasBid, setHasBid] = useState(false);

  // Check if the user has already placed a bid
  useEffect(() => {
    const checkHasBid = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(
          `http://localhost:8000/api/bid/getBid/${_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setHasBid(res.data.existingBid ? true : false);
        console.log("Bid status:", res.data.existingBid);
      } catch (error) {
        console.error("Error checking bid status:", error);
        setError("Failed to check bid status.");
        setHasBid(false);
      }
    };
    checkHasBid();
  }, [_id]);
  // Fetch project data based on project ID
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/project/getlistproject/${_id}`
        );
        setProject(response.data.project);
        setLoading(false);
        console.log("_id:", _id);
        console.log(response.data.project);
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to fetch project data."
        );
      }
    };
    fetchProject();
  }, [_id]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time for display
  const formatTime = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#0a0a20]">
      {/* Navbar */}
      <Navbar />

      {/* Main Section */}
      <main className="w-full min-h-screen flex flex-col items-center p-4 overflow-auto">
        {/* Bidding Page Container */}
        <section className="w-full max-w-4xl bg-[#1a1a1a]/80 backdrop-blur-md text-white rounded-xl shadow-2xl p-8 relative mt-8 border border-blue-500/20">
          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-600/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-600/20 rounded-full blur-xl"></div>

          {/* Header with Bookmark and Timer */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full animate-pulse">
                Live
              </span>
              <span className="text-gray-300">Ends in: {formatTime()}</span>
            </div>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="text-gray-300 hover:text-yellow-400 transition-colors"
            >
              {isBookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 fill-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              )}
            </button>
          </div>

          {/* Project Image with Overlay */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg mb-6">
            <img
              src={project.Project_cover_photo || "/api/placeholder/800/400"}
              alt="AI Chatbot System"
              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-3xl font-bold text-white tracking-wide">
                {project.project_Title}
              </h1>
              <div className="flex items-center mt-2">
                <div className="flex -space-x-2">
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-black"
                    src="/api/placeholder/32/32"
                    alt="Contributor"
                  />
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-black"
                    src="/api/placeholder/32/32"
                    alt="Contributor"
                  />
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-black"
                    src="/api/placeholder/32/32"
                    alt="Contributor"
                  />
                </div>
                <span className="ml-2 text-white text-sm">
                  {project.Project_Contributor} Contributors
                </span>
              </div>
            </div>
          </div>

          {/* Bid Details Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#252525] p-4 rounded-lg border border-blue-500/30 shadow-lg hover:shadow-blue-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Starting Bid</p>
              <p className="text-2xl font-bold text-white">
                ₹{project.project_starting_bid}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-green-500/30 shadow-lg hover:shadow-green-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Current Bid</p>
              <p className="text-2xl font-bold text-green-400">
                ₹{project.Project_Bid_Amount}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-purple-500/30 shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Contributors</p>
              <p className="text-2xl font-bold text-white">
                {project.Project_Contributor}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-yellow-500/30 shadow-lg hover:shadow-yellow-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Total Bids</p>
              <p className="text-2xl font-bold text-white">
                {project.Project_Number_Of_Bids}
              </p>
            </div>
          </div>

          {/* Project Description */}
          <div className="bg-[#232323] rounded-xl p-6 border border-gray-700/50 mb-8">
            <h2 className="text-xl font-bold text-blue-400 mb-4">
              Project Details
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Overview</h3>
                <p className="text-gray-300 mt-1">
                  {project.Project_Description}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.Project_tech_stack ? (
                    project.Project_tech_stack.split(",").map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm"
                      >
                        {tech.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">
                      No tech stack available
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">
                  Key Features
                </h3>
                <ul className="mt-2 space-y-2 list-none">
                  {project.Project_Features ? (
                    project.Project_Features.split("\n")
                      .filter((feature) => feature.trim() !== "") // 🛠️ Filter empty lines
                      .map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-6 w-6 text-green-400 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <span className="text-gray-300">
                              {feature.trim()}
                            </span>
                          </div>
                        </li>
                      ))
                  ) : (
                    <span className="text-gray-400">No features available</span>
                  )}
                </ul>
              </div>

              <div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Looking For
                  </h3>
                  <ul className="mt-2 space-y-2 list-none">
                    {project.Project_looking ? (
                      project.Project_looking.split("\n")
                        .filter((item) => item.trim() !== "") // 🛠️ Filter empty lines
                        .map((item, index) => (
                          <li key={index} className="flex items-start">
                            <svg
                              className="h-6 w-6 text-green-400 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <span className="text-gray-300">
                                {item.trim()}
                              </span>
                            </div>
                          </li>
                        ))
                    ) : (
                      <span className="text-gray-400">
                        No requirements available
                      </span>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-20 rounded-full blur-xl"></div>
            <h2 className="text-xl font-bold text-white mb-2">
              Ready to contribute?
            </h2>
            <p className="text-gray-300 mb-4">
              Your expertise in bug hunting can help shape this project. Join
              the team and earn rewards!
            </p>
            <Link to={hasBid ? "#" : `/bidingproposal/${_id}`}>
              <button
                className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-lg rounded-lg hover:from-blue-700 hover:to-blue-900 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 ${
                  hasBid ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={(e) => {
                  if (hasBid) {
                    e.preventDefault();
                    alert(
                      "You already placed a bid for this project. Wait for the bid completion."
                    );
                  }
                }}
                disabled={hasBid}
              >
                {hasBid ? "You already placed a bid" : "Place a Bid Now"}
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BidingPage;
