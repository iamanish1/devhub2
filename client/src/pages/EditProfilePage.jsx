import { useState } from "react";
import Navbar from "../components/NavBar";

const EditProfilePage = () => {
  // Dummy initial data, replace with props or API as needed
  const [form, setForm] = useState({
    name: "Your Name",
    username: "yourusername",
    email: "your.email@example.com",
    role: "Developer",
    bio: "Passionate about open source, AI, and building cool things. Always learning.",
    location: "India",
    github: "https://github.com/yourusername",
    twitter: "https://twitter.com/yourusername",
    instagram: "https://instagram.com/yourusername",
    skills: "React, Node.js, MongoDB, Firebase, Tailwind CSS",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send form data to API
    alert("Profile updated!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex flex-col items-center pt-[10vmin] px-4">
        <Navbar/>
      <div className="w-full max-w-xl bg-[#181b23] rounded-2xl shadow-lg border border-blue-500/20 p-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-8 text-center">
          Edit Profile
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-gray-300 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Role</label>
            <input
              type="text"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">GitHub</label>
            <input
              type="url"
              name="github"
              value={form.github}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Twitter</label>
            <input
              type="url"
              name="twitter"
              value={form.twitter}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Instagram</label>
            <input
              type="url"
              name="instagram"
              value={form.instagram}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-[#23272f] text-white border border-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
