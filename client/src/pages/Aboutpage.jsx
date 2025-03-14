import { FaUsers, FaCode, FaRocket, FaLaptopCode } from "react-icons/fa";
import { Link } from "react-router-dom";
import Navbar from "../components/NavBar";

const AboutPage = () => {
  return (  
    <>
      {/* Nav-bar */}
      <Navbar />
      <div className="bg-[#121212] text-white min-h-screen px-6 md:px-20 py-10">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#00A8E8]">
            Empowering Developers. Building the Future.
          </h1>
          <p className="text-lg text-gray-300 mt-4">
            Dev Hub is a platform designed for developers to connect, collaborate, and grow in a thriving tech community.
          </p>
          <Link to="/createaccount">
            <button className="mt-6 bg-[#00A8E8] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#0087b5] transition">
              Join Dev Hub Today
            </button>
          </Link>
        </section>

        {/* What is Dev Hub? */}
        <section className="text-center py-10">
          <h2 className="text-3xl font-semibold text-[#00A8E8]">What is Dev Hub?</h2>
          <p className="text-gray-300 mt-4 max-w-3xl mx-auto">
            Dev Hub is the first developer-centric social platform that combines networking, real-time collaboration, 
            and skill-building in one place. Whether you're a beginner or an expert, Dev Hub helps you grow, connect, and showcase your work.
          </p>
        </section>

        {/* Core Features */}
        <section className="py-10">
          <h2 className="text-3xl font-semibold text-[#00A8E8] text-center">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-6">
            <FeatureCard icon={<FaUsers size={30} />} title="Developer Profiles" text="Showcase your skills, projects, and experience." />
            <FeatureCard icon={<FaCode size={30} />} title="Coding Rooms" text="Collaborate in real time with fellow developers." />
            <FeatureCard icon={<FaRocket size={30} />} title="Live Coding Events" text="Compete, learn, and participate in challenges." />
            <FeatureCard icon={<FaLaptopCode size={30} />} title="Project Hub" text="Share projects, get feedback, and find collaborators." />
          </div>
        </section>

        {/* Mission */}
        <section className="py-10 text-center">
          <h2 className="text-3xl font-semibold text-[#00A8E8]">Our Mission</h2>
          <p className="text-gray-300 mt-4 max-w-3xl mx-auto">
            To build an inclusive and innovative space where developers can connect, learn, and grow through real-time collaboration and knowledge sharing.
          </p>
        </section>

        {/* Why Dev Hub? */}
        <section className="py-10">
          <h2 className="text-3xl font-semibold text-[#00A8E8] text-center">Why Dev Hub?</h2>
          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <WhyCard title="For Beginners" text="Learn from experts, find mentors, and work on real-world projects." />
            <WhyCard title="For Professionals" text="Network with top developers, contribute to open-source, and get recognized." />
            <WhyCard title="For Teams & Startups" text="Collaborate in live coding rooms and streamline development workflows." />
            <WhyCard title="AI-Powered Assistance" text="Get AI-driven suggestions and project recommendations." />
          </div>
        </section>

        {/* Join Dev Hub CTA */}
        <section className="text-center py-12">
          <h2 className="text-3xl font-semibold text-[#00A8E8]">Join Dev Hub Today</h2>
          <p className="text-gray-300 mt-4">Be part of the future of developer networking. Start building, learning, and connecting today.</p>
          <Link to="/loginaccount">
            <button className="mt-6 bg-[#00A8E8] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#0087b5] transition">
              Sign Up Now
            </button>
          </Link>
        </section>
      </div>
    </>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, text }) => (
  <div className="bg-[#1E1E1E] p-6 rounded-lg text-center shadow-lg">
    <div className="text-[#00A8E8] mb-4">{icon}</div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-gray-400 mt-2">{text}</p>
  </div>
);

// Why Dev Hub Card Component
const WhyCard = ({ title, text }) => (
  <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg">
    <h3 className="text-xl font-semibold text-[#00A8E8]">{title}</h3>
    <p className="text-gray-400 mt-2">{text}</p>
  </div>
);

export default AboutPage;
