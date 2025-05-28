import Navbar from "../components/NavBar";
import axios from "axios";
import { useState, useEffect } from "react";
import { FaGithub, FaTwitter, FaInstagram } from "react-icons/fa";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/getuser", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
  if (!user) return <div className="text-white p-8">No user data found.</div>;

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
            <span className="text-gray-400 text-sm">@{user.username}</span>
            <span className="text-blue-400 text-sm">{user.usertype}</span>
            {/* Add more fields as your API grows */}
            <div className="flex flex-col gap-2 w-full mt-4">
              <a
                href={user.github || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <FaGithub className="text-lg" />
                Github
              </a>
              <a
                href={user.twitter || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <FaTwitter className="text-lg" />
                Twitter
              </a>
              <a
                href={user.instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A8E8] hover:text-white transition font-medium px-4 py-2 rounded-lg hover:bg-blue-500/10"
              >
                <FaInstagram className="text-lg" />
                Instagram
              </a>
            </div>
            <div>
              {/* edit profile button */}
              <button className="mt-6 bg-blue-500 text-white px-[10vmin] py-2 rounded-lg hover:bg-blue-600 transition">
                Edit Profile
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 bg-[#1a1a1a]/90 rounded-2xl shadow-xl border border-blue-500/20 p-8">
            <section className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Profile Info
              </h2>
              <ul className="text-gray-300">
                <li>
                  <strong>Email:</strong> {user.email}
                </li>
                <li>
                  <strong>Username:</strong> {user.username}
                </li>
                <li>
                  <strong>Role:</strong> {user.usertype}
                </li>
                {/* Add more fields here as your API returns them */}
              </ul>
            </section>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;
