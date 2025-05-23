import Navbar from "../components/NavBar";

const ProfilePage = () => {
  const user = {
    name: "Your Name",
    username: "yourusername",
    email: "your.email@example.com",
    role: "Developer",
    bio: "Passionate about open source, AI, and building cool things. Always learning.",
    location: "India",
    joined: "Joined May 2024",
    avatar: null,
    stats: {
      projects: 8,
      contributions: 42,
      followers: 120,
      following: 17,
    },
    skills: ["React", "Node.js", "MongoDB", "Firebase", "Tailwind CSS"],
    links: {
      github: "https://github.com/yourusername",
      website: "https://yourwebsite.com",
      twitter: "https://twitter.com/yourusername",
    },
    recentProjects: [
      {
        name: "AI Chatbot System",
        date: "May 2024",
        description: "A smart chatbot using NLP and ML.",
      },
      {
        name: "Bug Tracker App",
        date: "Apr 2024",
        description: "A collaborative bug tracking platform.",
      },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex justify-center pt-[10vmin] px-4">
        <section className="w-full max-w-6xl flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-1/3 w-full bg-[#181b23] rounded-2xl shadow-lg border border-blue-500/20 p-8 flex flex-col items-center">
            <div className="h-36 w-36 bg-[#00A8E8] rounded-full flex items-center justify-center shadow-lg overflow-hidden mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
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
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <span className="text-gray-400 text-sm">@{user.username}</span>
            <span className="text-blue-400 text-sm">{user.role}</span>
            <span className="text-gray-400 text-xs">{user.location}</span>
            <span className="text-gray-500 text-xs mb-4">{user.joined}</span>
            <div className="flex justify-around w-full mb-6">
              {[
                { label: "Followers", value: user.stats.followers },
                { label: "Following", value: user.stats.following },
                { label: "Projects", value: user.stats.projects },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-bold text-lg">{item.value}</p>
                  <p className="text-gray-400 text-xs">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <a
                href={user.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00A8E8] hover:underline text-sm"
              >
                GitHub
              </a>
              <a
                href={user.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00A8E8] hover:underline text-sm"
              >
                Website
              </a>
              <a
                href={user.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00A8E8] hover:underline text-sm"
              >
                Twitter
              </a>
            </div>
            <button className="mt-6 w-full bg-[#00A8E8] hover:bg-[#008fc7] text-white font-medium py-2 rounded-lg shadow-md transition-all">
              Edit Profile
            </button>
          </aside>

          {/* Main Content */}
          <div className="flex-1 bg-[#1a1a1a]/90 rounded-2xl shadow-xl border border-blue-500/20 p-8">
            <section className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Bio</h2>
              <p className="text-gray-300">{user.bio}</p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {user.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-2">
                Activity Summary
              </h2>
              <div className="flex gap-8">
                <div>
                  <span className="block text-white font-bold text-lg">
                    {user.stats.contributions}
                  </span>
                  <span className="text-gray-400 text-xs">Contributions</span>
                </div>
                <div>
                  <span className="block text-white font-bold text-lg">
                    {user.stats.projects}
                  </span>
                  <span className="text-gray-400 text-xs">Projects</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-blue-400 mb-4">
                Recent Projects
              </h2>
              <ul className="space-y-3">
                {user.recentProjects.map((proj, idx) => (
                  <li
                    key={idx}
                    className="bg-[#232323] p-4 rounded-xl border border-blue-500/10"
                  >
                    <div className="flex justify-between flex-col md:flex-row md:items-center">
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
                ))}
              </ul>
            </section>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;
