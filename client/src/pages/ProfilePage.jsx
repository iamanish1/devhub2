import Navbar from "../components/NavBar";
import axios from "axios";
import { useState, useEffect } from "react";
import { FaGithub, FaTwitter, FaInstagram } from "react-icons/fa";
import { AiOutlineGlobal } from "react-icons/ai";

import { Link } from "react-router-dom";

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState({});
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/getuser", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(response.data);
        console.log("User data fetched:", response.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserProfile(response.data);
        console.log("User profile fetched:", response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Mock recent_projects if not present (for demo)
  const recentProjects =
    userProfile.recent_projects && userProfile.recent_projects.length > 0
      ? userProfile.recent_projects
      : [
          {
            name: "AI Chatbot",
            date: "May 2025",
            description: "A smart chatbot using NLP.",
          },
          {
            name: "Bug Tracker",
            date: "Apr 2025",
            description: "A collaborative bug tracking platform.",
          },
        ];

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
  if (!userProfile || !userProfile._id)
    return <div className="text-white p-8">No user data found.</div>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex justify-center pt-[10vmin] px-4">
        <section className="w-full max-w-6xl flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-1/3 w-full bg-[#181b23] rounded-2xl shadow-lg border border-blue-500/20 p-8 flex flex-col items-center">
            <div className="h-36 w-36 bg-[#00A8E8] rounded-full flex items-center justify-center shadow-lg overflow-hidden mb-4">
              {/* Avatar placeholder */}
              <svg
                className="w-20 h-20 text-white opacity-80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">{user.email}</h2>
            <span className="text-gray-400 text-sm mt-[2vmin]">
              {user.username}
            </span>
            <span className="text-gray-400 text-sm mt-[2vmin]">
              {user.usertype}
            </span>
            <div className="flex flex-col gap-2 w-full mt-4">
              <a
                href={userProfile.user_profile_github || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <FaGithub className="text-lg" />
                Github
              </a>
              <a
                href={userProfile.user_profile_linkedIn || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <FaTwitter className="text-lg" />
                LinkedIn
              </a>
              <a
                href={userProfile.user_profile_instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <FaInstagram className="text-lg" />
                Instagram
              </a>
              <a
                href={userProfile.user_profile_website || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <AiOutlineGlobal className="text-lg" />
                Website
              </a>
            </div>
            <div>
              <Link to="/editprofile">
                <button className="mt-6 bg-blue-500 text-white px-[10vmin] py-2 rounded-lg hover:bg-blue-600 transition">
                  Edit Profile
                </button>
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 bg-[#1a1a1a]/90 rounded-2xl shadow-xl border border-blue-500/20 p-8">
            <section className="mb-6">
              <div className="text-2xl font-bold text-blue-500 mb-4">Bio</div>
              <p className="text-white text-sm">
                {userProfile.user_profile_bio || "No bio available."}
              </p>
            </section>
            <section>
              <div className="text-2xl font-bold text-blue-500 mb-4">
                Skills
              </div>
              <ul className="list-disc list-inside text-white text-sm">
                {userProfile.user_profile_skills &&
                userProfile.user_profile_skills.length > 0 ? (
                  userProfile.user_profile_skills.map((skill, index) => (
                    <li key={index} className="mb-2">
                      {skill}
                    </li>
                  ))
                ) : (
                  <li>No skills listed.</li>
                )}
              </ul>
            </section>
            {/* Improved Activity Summary */}
            <section className="mt-6">
              <div className="text-2xl font-bold text-blue-500 mb-4">
                Activity Summary
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#232a34] rounded-xl p-6 flex flex-col items-center shadow border border-blue-500/10">
                  <span className="text-3xl font-bold text-blue-400">
                    {userProfile.user_project_contribution || 0}
                  </span>
                  <span className="text-gray-300 mt-2">Contributions</span>
                </div>
                <div className="bg-[#232a34] rounded-xl p-6 flex flex-col items-center shadow border border-blue-500/10">
                  <span className="text-3xl font-bold text-blue-400">
                    {userProfile.user_completed_projects || 0}
                  </span>
                  <span className="text-gray-300 mt-2">Completed Projects</span>
                </div>
              </div>
            </section>
            {/* Recent Projects Section */}
            <section className="mt-6">
              <div className="text-2xl font-bold text-blue-500 mb-4">
                Recent Projects
              </div>
              <ul className="space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((proj, idx) => (
                    <li
                      key={idx}
                      className="bg-[#232323] p-4 rounded-xl border border-blue-500/10"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="text-white font-semibold">
                            {proj.name}
                          </h4>
                          <span className="text-gray-500 text-sm">
                            {proj.date}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2 md:mt-0">
                          {proj.description}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No recent projects.</li>
                )}
              </ul>
            </section>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;
