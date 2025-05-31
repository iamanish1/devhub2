import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const [profileExsist, setProfileExist] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch user profile existence
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await axios.get("http://localhost:8000/api/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data.profile) {
          setProfileExist(true);
          console.log("User profile exists:", response.data.profile);
        } else {
          setProfileExist(false);
          console.log("User profile does not exist.");
        }
        console.log("User profile existence fetched:", response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
    fetchUserProfile();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logoutUser();
    setDropdownOpen(false);
  };

  // Animation variants
  const navbarVariants = {
    initial: { y: -100 },
    animate: { y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const linkVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.1, color: "#00A8E8" },
  };

  const logoVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    hover: {
      scale: 1.05,
      textShadow: "0px 0px 8px rgba(0, 168, 232, 0.7)",
      color: "#00A8E8",
    },
  };

  const buttonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: {
      scale: 1.05,
      backgroundColor: "#0090c9",
      boxShadow: "0px 0px 15px rgba(0, 168, 232, 0.7)",
    },
    tap: { scale: 0.95 },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, pointerEvents: "none" },
    visible: {
      opacity: 1,
      y: 0,
      pointerEvents: "auto",
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      y: -10,
      pointerEvents: "none",
      transition: { duration: 0.15 },
    },
  };

  return (
    <motion.nav
      initial="initial"
      animate="animate"
      variants={navbarVariants}
      className={`fixed top-0 w-full ${
        scrolled ? "bg-opacity-95 backdrop-blur-sm shadow-lg" : "bg-opacity-100"
      } bg-[#1E1E1E] h-[8vmin] flex justify-between items-center z-50 transition-all duration-300`}
    >
      <motion.div variants={logoVariants} whileHover="hover">
        <Link to="/" className="flex items-center">
          <h1 className="text-white text-[4vmin] font-bold ml-[3vmin] transition-colors duration-300">
            <span className="text-[#00A8E8]">Dev</span>Hubs
          </h1>
        </Link>
      </motion.div>

      <div className="flex items-center">
        <ul className="flex items-center gap-[4vmin] text-white mr-[3vmin]">
          {["dashboard", "listproject", "about"].map((item, index) => (
            <motion.li
              key={item}
              variants={linkVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Link
                to={`/${item}`}
                className="text-[2vmin] font-medium tracking-wide"
              >
                {item === "dashboard"
                  ? "Explore Projects"
                  : item === "listproject"
                  ? "List Project"
                  : "About"}
              </Link>
              <motion.div
                className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00A8E8]"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.li>
          ))}

          {/* Profile Dropdown for logged-in users */}
          {user ? (
            <motion.div
              ref={dropdownRef}
              className="relative"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="h-[5vmin] w-[5vmin] bg-[#00A8E8] rounded-full text-[2.3vmin] font-medium transition-all duration-300 flex items-center justify-center focus:outline-none"
              ></button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    key="dropdown"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="absolute right-0 mt-2 w-48 bg-[#232323] rounded-lg shadow-xl border border-[#00A8E8]/30 z-50 overflow-hidden"
                  >
                    {profileExsist ? (
                      <Link
                        to="/profile"
                        className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Profile
                      </Link>
                    ) : (
                      <Link
                        to="/editprofile"
                        className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Create Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-6 py-3 text-white hover:bg-red-500 hover:text-white transition-colors text-[2vmin]"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: 0.3 }}
            >
              <Link to="/createaccount">
                <button className="h-[5vmin] w-[22vmin] bg-[#00A8E8] rounded-[2vmin] text-[2.3vmin] font-medium transition-all duration-300 flex items-center justify-center">
                  Create Account
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                  >
                    →
                  </motion.span>
                </button>
              </Link>
            </motion.div>
          )}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
