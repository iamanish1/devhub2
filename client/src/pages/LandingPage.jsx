/* eslint-disable no-unused-vars */
import Navbar from "../components/NavBar";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <div className="bg-[#121212] text-white font-sans">
        {/* Hero Section */}
        <motion.section
          className="h-screen flex flex-col justify-center items-center text-center px-6"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <motion.h1 className="text-5xl font-bold">
            Welcome to DevHubs
          </motion.h1>
          <motion.p className="text-lg text-gray-300 mt-4 max-w-2xl">
            The ultimate platform where junior developers collaborate with
            experienced mentors, contribute to real-world projects, and earn
            while learning.
          </motion.p>
          <Link to="/createaccount">
            <motion.button className="mt-6 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Get Started
            </motion.button>
          </Link>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          className="py-16 px-8 text-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-semibold mb-8">How DevHubs Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {["List Projects", "Bid & Collaborate", "Earn & Learn"].map(
              (title, index) => (
                <motion.div
                  key={index}
                  className="p-6 bg-gray-900 rounded-lg"
                  variants={sectionVariants}
                >
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="text-gray-400 mt-2">
                    {index === 0
                      ? "Project owners list their projects and find contributors."
                      : index === 1
                      ? "Junior developers bid to contribute and gain experience."
                      : "Contributors earn for their work and build their portfolios."}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </motion.section>

        {/* Featured Projects Section */}
        <motion.section
          className="py-16 px-8"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="flex justify-center items-center flex-col">
          <h2 className="text-3xl font-semibold mb-8">Featured Projects</h2>
          <p className="text-gray-400">
            Check out some of the best projects listed on DevHubs.
          </p>
          </motion.div>
          
          <motion.div className="flex justify-center items-center flex-row gap-[3vmin] mt-[3vmin]">
            <motion.div>
            <ProjectCard />
            </motion.div>
            <motion.div>
            <ProjectCard/>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          className="py-16 px-8 text-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-semibold mb-8">What Our Users Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                text: "DevHubs gave me my first real-world experience!",
                name: "Vani Sharma",
              },
              {
                text: "A great place to grow as a developer and earn at the same time.",
                name: "Ishan Awasti",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="p-6 bg-gray-900 rounded-lg"
                variants={sectionVariants}
              >
                <p className="text-gray-400">"{testimonial.text}"</p>
                <p className="mt-2 font-semibold">- {testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQs Section */}
        <motion.section
          className="py-16 px-8 text-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-semibold mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "How do I start bidding?",
                answer: "Simply sign up, browse projects, and place your bid.",
              },
              {
                question: "Are payments secure?",
                answer: "Yes! We use escrow to ensure secure transactions.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="p-6 bg-gray-900 rounded-lg"
                variants={sectionVariants}
              >
                <h3 className="text-xl font-semibold">{faq.question}</h3>
                <p className="text-gray-400 mt-2">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          className="py-16 px-8 text-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-semibold">Start Your Journey Today!</h2>
          <p className="text-gray-400 mt-2">
            Join DevHubs and take your career to the next level.
          </p>
          <Link to="/createaccount">
            <motion.button className="mt-6 bg-green-500 px-6 py-3 rounded-lg hover:bg-green-600 transition">
              Join Now
            </motion.button>
          </Link>
        </motion.section>
      </div>
    </>
  );
};

export default LandingPage;
