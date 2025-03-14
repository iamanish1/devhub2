import Navbar from "../components/NavBar";
import { Link } from "react-router-dom";

const BidingPage = () => {
  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Main Section (Now Scrollable) */}
      <main className="w-full min-h-screen flex flex-col items-center bg-[#121212] p-4 overflow-auto">
        {/* Bidding Page Container */}
        <section className="w-full max-w-[90vw] bg-[#1a1a1a] text-white rounded-lg shadow-lg p-6">
          {/* Project Image */}
          <div className="flex justify-center">
            <img
              src="https://techvidvan.com/tutorials/wp-content/uploads/2021/12/python-chatbot-project-nltk-ai.webp"
              alt="Project"
              className="w-full max-w-[80vmin] rounded-lg shadow-lg"
            />
          </div>

          {/* Project Title */}
          <h1 className="text-center text-[4vmin] font-bold uppercase mt-6">
            AI Chatbot System
          </h1>

          {/* Bid Details */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-[2.5vmin]">
            <div className="px-6 py-2 border border-white rounded-lg">
              <strong>Starting Bid:</strong> ₹500
            </div>
            <div className="px-6 py-2 border border-white rounded-lg">
              <strong>Current Bid:</strong> ₹500
            </div>
            <div className="px-6 py-2 border border-white rounded-lg">
              <strong>Contributors:</strong> 3
            </div>
            <div className="px-6 py-2 border border-white rounded-lg">
              <strong>Total Bids:</strong> 10
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[0.3vmin] w-full bg-white my-6"></div>

          {/* Project Description (Now Scrollable if Needed) */}
          <div className="text-[2.3vmin] p-4 border border-white rounded-lg">
            <p>
              <strong>Overview:</strong> Bug Hunt Arena is a platform where
              developers submit projects for testing, and testers compete to
              find and report bugs. Our AI-powered system validates bug reports,
              assigns points based on severity, and ranks testers on a
              leaderboard.
            </p>

            <p className="mt-3">
              <strong>Tech Stack:</strong>
              <br />
              Frontend: React, Tailwind CSS. <br />
              Backend: Node.js, MongoDB. <br />
              Additional Tools: Judge0 for in-app code execution, Firebase for
              real-time updates.
            </p>

            <p className="mt-3">
              <strong>Features:</strong>
            </p>
            <ul className="list-disc pl-6">
              <li>
                <strong>AI-Verified Bug Reports:</strong> AI assists in
                validating and categorizing reported bugs.
              </li>
              <li>
                <strong>Gamification & Leaderboard:</strong> Earn points, rank
                up, and get rewards for valid bug discoveries.
              </li>
              <li>
                <strong>Live Code Execution:</strong> Inbuilt compiler for
                testing vulnerabilities in real time.
              </li>
            </ul>

            <p className="mt-3">
              <strong>Looking For:</strong> Beta testers, contributors, and
              security experts to refine the bug detection system and improve
              AI-assisted validation.
            </p>
          </div>

          {/* Bid Button */}
          <div className="flex justify-center mt-6">
            <Link to="/bidingproposal">
              <button className="px-6 py-3 bg-blue-500 text-white text-[2.5vmin] rounded-lg hover:bg-blue-600">
                Place a Bid
              </button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default BidingPage;
