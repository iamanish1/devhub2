import { useState } from "react";
import { Link } from "react-router-dom";
const ProjectCard = () => {
  const fullDescription = `
    Overview: Bug Hunt Arena is a platform where developers submit projects for testing, 
    and testers compete to find and report bugs. Our AI-powered system validates bug reports, 
    assigns points based on severity, and ranks testers on a leaderboard. 
    This makes bug hunting engaging while helping developers improve their software quality. 
    Tech Stack: Frontend: React, Tailwind CSS. Backend: Node.js, MongoDB. 
    Additional Tools: Judge0 for in-app code execution, Firebase for real-time updates.
    Features: AI-Verified Bug Reports - AI assists in validating and categorizing reported bugs.
    Gamification & Leaderboard - Earn points, rank up, and get rewards for valid bug discoveries.
    Live Code Execution - Inbuilt compiler for testing vulnerabilities in real time.
    Looking For: We're looking for beta testers, contributors, and security experts to refine 
    the bug detection system and improve AI-assisted validation.
  `;

  const wordLimit = 70; // Set word limit
  const words = fullDescription.split(" ");
  const shortDescription = words.slice(0, wordLimit).join(" ") + "...";

  const [showFull, setShowFull] = useState(false);
  return (
    <>
      <div
        className="h-auto w-full border border-white
         rounded-[1vmin] ml-[2vmin] mr-[2vmin] flex flex-col px-[2vmin] py-[2vmin]"
      >
        {/*  project Title  */}
        <section>
          <h1 className="text-white text-[5vmin] font-semibold uppercase">
            Ai-Chat Boat System
          </h1>
        </section>
        {/* Project Description */}
        <section>
          <p className="text-[#B0BEC5] text-[2.2vmin]">
            {showFull ? fullDescription : shortDescription}
          </p>
          <button
            className="text-[#00A8E8] text-[2vmin] underline mt-[0.5vmin]"
            onClick={() => setShowFull(!showFull)}
          >
            {showFull ? "Show Less" : "Read More"}
          </button>
        </section>
        {/* Tech Stack  */}
        <section className="flex   flex-col">
          <h2 className="text-white text-[2.5vmin] font-semibold mt-[1vmin]">
            Tech Stack
          </h2>
          <ul className="flex items-center  flex-row  flex-wrap gap-[2vmin] text-[#B0BEC5] text-center m-[1.5vmin]">
            <li className="h-[5vmin] w-[20vmin] border-[0.35vmin] border-white rounded-[2.3vmin]">
              Python
            </li>
            <li className="h-[5vmin] w-[20vmin] border-[0.35vmin] border-white rounded-[2.3vmin]">
              TensorFlow
            </li>
            <li className="h-[5vmin] w-[20vmin] border-[0.35vmin] border-white rounded-[2.3vmin]">
              Rasa
            </li>
          </ul>
        </section>
        {/* Budget */}
        <section>
          <h2 className="text-white text-[2.5vmin] font-semibold">Budget</h2>
          <p className="text-[#B0BEC5] text-[1.5vmin">₹15,000</p>
        </section>
        {/* Duration */}
        <section>
          <h2 className="text-white text-[2.5vmin] font-semibold mt-[1vmin]">
            Duration
          </h2>
          <p className="text-[#B0BEC5] text-[1.5vmin">12 months</p>
        </section>
        {/* Active Biders */}
        <section>
          <h2 className="text-white text-[2.5vmin] font-semibold mt-[1vmin]">
            Active Bidders
          </h2>
          <p className="text-[#B0BEC5] text-[1.5vmin">10</p>
        </section>
        {/* Biding Button */}
        <section className="flex justify-center">
          <Link to="/bidingPage">
            <button className="bg-[#00A8E8] text-white w-[70vmin] h-[5vmin] rounded-[2.5vmin] font-semibold hover:cursor-pointer">
              Bid Now
            </button>
          </Link>
        </section>
      </div>
    </>
  );
};

export default ProjectCard;
