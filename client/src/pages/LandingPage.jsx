import Navbar from "../components/NavBar";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import { useState, useEffect } from "react";
import axios from "axios";
// Animation variants with more sophisticated effects
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const hoverScale = {
  scale: 1.05,
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
  transition: { duration: 0.3 },
};

const LandingPage = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isScrolled, setIsScrolled] = useState(false);
  const [project, setProject] = useState([]);
  // Handle screen resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Handle scroll for navbar effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/project/getlistproject"
        );
        const sortedProjects = response.data.project.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProject(sortedProjects.slice(0, 3)); // Only keep the latest 3 projects
        console.log("Latest 3 projects:", sortedProjects.slice(0, 3));
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };
    fetchProject();
  }, []);

  // Determine if mobile view
  const isMobile = windowWidth < 768;

  return (
    <>
      <motion.div
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#121212] shadow-lg" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Navbar />
      </motion.div>

      <div className="bg-[#121212] text-white font-sans overflow-hidden">
        {/* Hero Section with Parallax Effect */}
        <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
          {/* Background animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-blue-500 opacity-10"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  x: [
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerWidth,
                  ],
                  y: [
                    Math.random() * window.innerHeight,
                    Math.random() * window.innerHeight,
                  ],
                  transition: {
                    duration: Math.random() * 20 + 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                  },
                }}
                style={{
                  width: `${Math.random() * 100 + 20}px`,
                  height: `${Math.random() * 100 + 20}px`,
                }}
              />
            ))}
          </div>

          <motion.div
            className="relative z-10"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
              variants={itemFadeIn}
            >
              Welcome to DevHubs
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-gray-300 mt-6 max-w-2xl mx-auto"
              variants={itemFadeIn}
            >
              The ultimate platform where junior developers collaborate with
              experienced mentors, contribute to real-world projects, and earn
              while learning.
            </motion.p>

            <motion.div variants={itemFadeIn}>
              <Link to="/loginaccount">
                <motion.button
                  className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 rounded-lg text-lg font-medium shadow-lg"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </Link>
            </motion.div>

            <motion.div className="mt-12" variants={itemFadeIn}>
              <motion.div
                className="animate-bounce"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section - Card Hover Effects */}
        <motion.section
          className="py-20 px-4 md:px-8 text-center relative"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 relative inline-block"
              variants={itemFadeIn}
            >
              How DevHubs Works
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {[
                {
                  title: "List Projects",
                  description:
                    "Project owners list their projects and find contributors.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Bid & Collaborate",
                  description:
                    "Junior developers bid to contribute and gain experience.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Earn & Learn",
                  description:
                    "Contributors earn for their work and build their portfolios.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="p-8 bg-gray-900 rounded-2xl shadow-lg"
                  variants={itemFadeIn}
                  whileHover={hoverScale}
                >
                  {item.icon}
                  <h3 className="text-xl md:text-2xl font-bold mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Projects Section - Card Carousel for Mobile */}
        <motion.section
          className="py-20 px-4 md:px-8 relative"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div className="text-center mb-12" variants={itemFadeIn}>
              <motion.h2
                className="text-3xl md:text-4xl font-bold mb-4 relative inline-block"
                variants={itemFadeIn}
              >
                Featured Projects
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                />
              </motion.h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Check out some of the best projects listed on DevHubs.
              </p>
            </motion.div>

            {isMobile ? (
              // ✅ Mobile carousel view
              <div className="relative overflow-hidden px-4">
                <AnimatePresence>
                  <motion.div
                    className="flex snap-x snap-mandatory overflow-x-auto pb-8 -mx-4 px-4 space-x-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {project.map((proj) => (
                      <motion.div
                        key={proj._id}
                        className="snap-center shrink-0 w-full"
                        whileHover={hoverScale}
                      >
                        <ProjectCard project={proj} />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center space-x-2 mt-4">
                  {project.map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-600"
                      whileHover={{ scale: 1.5, backgroundColor: "#3B82F6" }}
                    />
                  ))}
                </div>
              </div>
            ) : project.length > 0 ? (
              // ✅ Desktop grid view
              <motion.div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {project.map((proj) => (
                  <motion.div
                    key={proj._id}
                    variants={itemFadeIn}
                    whileHover={hoverScale}
                  >
                    <ProjectCard project={proj} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-center text-gray-400">
                No featured projects found.
              </p>
            )}

            <motion.div className="text-center mt-12" variants={itemFadeIn}>
              <Link to="/dashboard">
                <motion.button
                  className="bg-transparent border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition duration-300"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
                >
                  View All Projects
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials Section - Floating Cards */}
        <motion.section
          className="py-20 px-4 md:px-8 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 relative inline-block"
              variants={itemFadeIn}
            >
              What Our Users Say
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  text: "DevHubs gave me my first real-world experience! The platform made it easy to find projects that matched my skill level and interests.",
                  name: "Vani Sharma",
                  role: "Junior Developer",
                },
                {
                  text: "A great place to grow as a developer and earn at the same time. The mentorship I received was invaluable for my career progression.",
                  name: "Ishan Awasti",
                  role: "Full Stack Developer",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="p-8 bg-gray-900 rounded-2xl shadow-lg relative"
                  variants={itemFadeIn}
                  whileHover={hoverScale}
                  animate={{
                    y: [0, -10, 0],
                    transition: {
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: index * 0.5,
                    },
                  }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 rounded-full p-2">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                    </svg>
                  </div>
                  <p className="text-gray-300 mt-4 mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="ml-2">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-gray-400 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ Section - Accordion Style */}
        <motion.section
          className="py-20 px-4 md:px-8"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center relative inline-block mx-auto"
              variants={itemFadeIn}
            >
              Frequently Asked Questions
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {[
                {
                  question: "How do I start bidding?",
                  answer:
                    "Simply sign up, browse projects, and place your bid. You can specify your rate, delivery timeline, and how your skills match the project requirements.",
                },
                {
                  question: "Are payments secure?",
                  answer:
                    "Yes! We use escrow to ensure secure transactions. Funds are only released to you when the project owner is satisfied with your work.",
                },
                {
                  question: "How is the mentorship structured?",
                  answer:
                    "Project owners can choose to offer mentorship as part of their projects. You'll receive code reviews, feedback, and guidance throughout the development process.",
                },
                {
                  question: "Can I work on projects part-time?",
                  answer:
                    "Absolutely! Many projects on DevHubs are flexible and can be completed on a part-time basis. You can set your availability when placing bids.",
                },
              ].map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  index={index}
                />
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Call to Action - Gradient Background */}
        <motion.section
          className="py-20 px-4 md:px-8 relative overflow-hidden"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30" />

          <motion.div
            className="relative z-10 max-w-4xl mx-auto text-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
              variants={itemFadeIn}
            >
              Start Your Journey Today!
            </motion.h2>

            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={itemFadeIn}
            >
              Join DevHubs and take your career to the next level. Connect with
              mentors, build your portfolio, and earn while you learn.
            </motion.p>

            <motion.div
              className="flex flex-col md:flex-row gap-4 justify-center"
              variants={itemFadeIn}
            >
              <Link to="/createaccount">
                <motion.button
                  className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-lg text-lg font-medium shadow-lg"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Now
                </motion.button>
              </Link>

              <Link to="/projects">
                <motion.button></motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <footer className="py-12 px-4 md:px-8 bg-[#0a0a0a] text-gray-400">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">DevHubs</h3>
              <p className="mb-4">
                Connecting junior developers with real-world projects and
                mentorship opportunities.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-blue-400">
                  LinkedIn
                </a>
                <a href="#" className="hover:text-blue-400">
                  GitHub
                </a>
                <a href="#" className="hover:text-blue-400">
                  X / Twitter
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/dashboard" className="hover:text-blue-400">
                    Explore Projects
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="hover:text-blue-400">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="/createaccount" className="hover:text-blue-400">
                    Join as Developer
                  </a>
                </li>
                <li>
                  <a href="/createaccount" className="hover:text-blue-400">
                    Join as Project Owner
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="hover:text-blue-400">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-blue-400">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-blue-400">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-blue-400">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy-policy" className="hover:text-blue-400">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-and-service" className="hover:text-blue-400">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/cookie-policy" className="hover:text-blue-400">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="/community-guidelines" className="hover:text-blue-400">
                    Community Guidelines
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 border-t border-gray-800 pt-6 text-center text-gray-500">
            <p>
              © 2025 DevHubs. All rights reserved. Built with  for developers.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

// FAQ Accordion Component
const FAQItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900"
      variants={itemFadeIn}
    >
      <motion.button
        className="w-full p-4 text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
      >
        <h3 className="text-xl font-semibold">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            className="w-6 h-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 pt-0 border-t border-gray-800 text-gray-400">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LandingPage;
