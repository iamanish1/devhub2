import Navbar from "../components/NavBar";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const BidingPage = () => {
  const [timeLeft, setTimeLeft] = useState(48 * 60 * 60); // 48 hours in seconds
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time for display
  const formatTime = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
              <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full animate-pulse">Live</span>
              <span className="text-gray-300">Ends in: {formatTime()}</span>
            </div>
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)} 
              className="text-gray-300 hover:text-yellow-400 transition-colors"
            >
              {isBookmarked ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              )}
            </button>
          </div>

          {/* Project Image with Overlay */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg mb-6">
            <img
              src="https://techvidvan.com/tutorials/wp-content/uploads/2021/12/python-chatbot-project-nltk-ai.webp"
              alt="AI Chatbot System"
              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-3xl font-bold text-white tracking-wide">
                AI Chatbot System
              </h1>
              <div className="flex items-center mt-2">
                <div className="flex -space-x-2">
                  <img className="h-8 w-8 rounded-full ring-2 ring-black" src="/api/placeholder/32/32" alt="Contributor" />
                  <img className="h-8 w-8 rounded-full ring-2 ring-black" src="/api/placeholder/32/32" alt="Contributor" />
                  <img className="h-8 w-8 rounded-full ring-2 ring-black" src="/api/placeholder/32/32" alt="Contributor" />
                </div>
                <span className="ml-2 text-white text-sm">3 Contributors</span>
              </div>
            </div>
          </div>

          {/* Bid Details Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#252525] p-4 rounded-lg border border-blue-500/30 shadow-lg hover:shadow-blue-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Starting Bid</p>
              <p className="text-2xl font-bold text-white">₹500</p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-green-500/30 shadow-lg hover:shadow-green-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Current Bid</p>
              <p className="text-2xl font-bold text-green-400">₹500</p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-purple-500/30 shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Contributors</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-yellow-500/30 shadow-lg hover:shadow-yellow-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Total Bids</p>
              <p className="text-2xl font-bold text-white">10</p>
            </div>
          </div>

          {/* Project Description */}
          <div className="bg-[#232323] rounded-xl p-6 border border-gray-700/50 mb-8">
            <h2 className="text-xl font-bold text-blue-400 mb-4">Project Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Overview</h3>
                <p className="text-gray-300 mt-1">
                  Bug Hunt Arena is a platform where developers submit projects for testing, and testers compete to
                  find and report bugs. Our AI-powered system validates bug reports, assigns points based on severity, 
                  and ranks testers on a leaderboard.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm">Tailwind CSS</span>
                  <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm">Node.js</span>
                  <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm">MongoDB</span>
                  <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm">Judge0</span>
                  <span className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-sm">Firebase</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Key Features</h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-medium text-white">AI-Verified Bug Reports:</span>
                      <span className="text-gray-300"> AI assists in validating and categorizing reported bugs.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-medium text-white">Gamification & Leaderboard:</span>
                      <span className="text-gray-300"> Earn points, rank up, and get rewards for valid bug discoveries.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-medium text-white">Live Code Execution:</span>
                      <span className="text-gray-300"> Inbuilt compiler for testing vulnerabilities in real time.</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Looking For</h3>
                <p className="text-gray-300 mt-1">
                  Beta testers, contributors, and security experts to refine the bug detection system and improve
                  AI-assisted validation.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-400 mb-4">Project Milestones</h2>
            <div className="relative">
              <div className="absolute h-full w-1 bg-gray-700 left-[15px]"></div>
              <div className="ml-8 space-y-6">
                <div className="relative">
                  <div className="absolute -left-8 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Project Start</h3>
                    <p className="text-gray-400 text-sm">Core functionality implemented</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-8 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">AI Integration</h3>
                    <p className="text-gray-400 text-sm">Bug validation system implemented</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-8 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Current Phase: Beta Testing</h3>
                    <p className="text-gray-400 text-sm">Looking for contributors and testers</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-8 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-400 font-medium">Public Launch</h3>
                    <p className="text-gray-500 text-sm">Upcoming</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-20 rounded-full blur-xl"></div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to contribute?</h2>
            <p className="text-gray-300 mb-4">Your expertise in bug hunting can help shape this project. Join the team and earn rewards!</p>
            <Link to="/bidingproposal">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-lg rounded-lg hover:from-blue-700 hover:to-blue-900 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/30">
                Place a Bid Now
              </button>
            </Link>
          </div>

          {/* Social Proof Section */}
          <div className="bg-[#232323] rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-blue-400 mb-4">What Others Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700/30">
                <div className="flex items-center mb-2">
                  <img className="h-10 w-10 rounded-full mr-2" src="/api/placeholder/40/40" alt="Reviewer" />
                  <div>
                    <p className="text-white font-medium">Alex Developer</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic">"Innovative approach to bug hunting. The AI validation is a game-changer!"</p>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700/30">
                <div className="flex items-center mb-2">
                  <img className="h-10 w-10 rounded-full mr-2" src="/api/placeholder/40/40" alt="Reviewer" />
                  <div>
                    <p className="text-white font-medium">Sam Tester</p>
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic">"The gamification elements keep me engaged. Looking forward to the final release!"</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BidingPage;
