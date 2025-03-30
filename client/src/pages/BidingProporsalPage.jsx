import Navbar from "../components/NavBar";
import { useState } from "react";
import { Link } from "react-router-dom";

const BidingProporsalPage = () => {
  const [bidAmount, setBidAmount] = useState(500);
  const [motivation, setMotivation] = useState("");
  const [skills, setSkills] = useState([
    { name: "React", selected: false },
    { name: "Node.js", selected: false },
    { name: "MongoDB", selected: false },
    { name: "AI/ML", selected: false },
    { name: "Security Testing", selected: false },
    { name: "UI/UX", selected: false },
  ]);
  const [yearsExperience, setYearsExperience] = useState(1);
  const [availableHours, setAvailableHours] = useState(10);

  const toggleSkill = (index) => {
    const updatedSkills = [...skills];
    updatedSkills[index].selected = !updatedSkills[index].selected;
    setSkills(updatedSkills);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#0a0a20]">
      {/* Nav-bar */}
      <Navbar />

      {/* Main Content Container */}
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Header Section */}
          <header className="mb-8 text-center relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-600/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-600/20 rounded-full blur-xl"></div>
            <h1 className="text-4xl font-bold text-white mb-2 relative z-10">Place Your Bid Proposal</h1>
            <p className="text-blue-400">AI Chatbot System Project</p>
            <div className="h-1 w-32 bg-blue-500 mx-auto mt-4 rounded-full"></div>
          </header>

          {/* Bid Form Container */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-md text-white rounded-xl shadow-2xl p-8 border border-blue-500/20 relative">
            {/* Project Summary */}
            <div className="mb-8 bg-[#232323] rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center">
                <img
                  src="https://techvidvan.com/tutorials/wp-content/uploads/2021/12/python-chatbot-project-nltk-ai.webp"
                  alt="Project"
                  className="w-16 h-16 rounded-lg object-cover mr-4"
                />
                <div>
                  <h2 className="font-semibold text-lg">AI Chatbot System</h2>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-3">Starting bid: ₹500</span>
                    <span>3 Contributors</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <form className="space-y-6">
              {/* Bid Amount Section */}
              <div className="space-y-2">
                <label className="text-blue-400 font-medium block">Your Bid Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg py-3 px-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your bid amount"
                    min="500"
                  />
                  <div className="absolute right-3 top-2">
                    <button
                      type="button"
                      onClick={() => setBidAmount(prev => Math.max(500, prev - 100))}
                      className="px-2 py-1 bg-gray-700 rounded-l-md hover:bg-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setBidAmount(prev => prev + 100)}
                      className="px-2 py-1 bg-gray-700 rounded-r-md hover:bg-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                {bidAmount < 500 && (
                  <p className="text-red-400 text-sm">Minimum bid amount is ₹500</p>
                )}
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <label className="text-blue-400 font-medium block">Your Relevant Skills</label>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => toggleSkill(index)}
                      className={`px-3 py-2 rounded-full text-sm transition-all ${
                        skill.selected
                          ? "bg-blue-600 text-white"
                          : "bg-[#252525] text-gray-300 hover:bg-[#303030]"
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience and Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-blue-400 font-medium block">Years of Experience</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded-md min-w-8 text-center">
                      {yearsExperience}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-blue-400 font-medium block">Hours Available Weekly</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={availableHours}
                      onChange={(e) => setAvailableHours(e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded-md min-w-8 text-center">
                      {availableHours}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivation Section */}
              <div className="space-y-2">
                <label className="text-blue-400 font-medium block">Why You Want to Contribute</label>
                <div className="relative">
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg py-3 px-4 min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Describe why you're the perfect match for this project..."
                  />
                  <div className="absolute bottom-3 right-3 text-gray-400 text-sm">
                    {motivation.length}/500
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-medium text-blue-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tips to Increase Your Chances
                </h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Highlight your experience with AI and chatbot systems</li>
                  <li>• Mention any similar projects you've worked on</li>
                  <li>• Be specific about how you can contribute to the project</li>
                </ul>
              </div>

              {/* Submit and Cancel Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all transform hover:scale-105 duration-300 shadow-lg hover:shadow-blue-500/30 font-medium"
                >
                  Submit Your Bid
                </button>
                <Link to="/bidingpage">
                  <button
                    type="button"
                    className="flex-1 bg-[#252525] text-gray-300 py-3 px-6 rounded-lg hover:bg-[#303030] transition-all w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </Link>
              </div>
            </form>
          </div>

          {/* Footer Section */}
          <footer className="mt-6 text-center text-gray-400 text-sm">
            <p>Your bid will be visible to the project owner immediately</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default BidingProporsalPage;
