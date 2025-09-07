import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import PremiumBadge from "./PremiumBadge";


const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const [profileExsist, setProfileExist] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasListedProjects, setHasListedProjects] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const dropdownRef = useRef(null);


  // Fetch user profile existence and subscription status
  useEffect(() => {
    async function fetchUserData() {
      try {
        const [profileResponse, subscriptionResponse, projectsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/payments/subscription/status`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard/projects`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
        ]);
        
        if (profileResponse.data.profile) {
          setProfileExist(true);
          setUserProfile(profileResponse.data.profile);
          console.log("User profile exists:", profileResponse.data.profile);
        } else {
          setProfileExist(false);
          setUserProfile(null);
          console.log("User profile does not exist.");
        }
        
        if (subscriptionResponse.data.success) {
          setSubscriptionStatus(subscriptionResponse.data.data);
          console.log("Subscription status:", subscriptionResponse.data.data);
        }
        
        // Check if user has listed any projects
        if (projectsResponse.data.projects && projectsResponse.data.projects.length > 0) {
          setHasListedProjects(true);
          console.log("User has listed projects:", projectsResponse.data.projects.length);
        } else {
          setHasListedProjects(false);
          console.log("User has no listed projects");
        }
        
        console.log("User data fetched:", { 
          profile: profileResponse.data, 
          subscription: subscriptionResponse.data,
          projects: projectsResponse.data.projects?.length || 0
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
    fetchUserData();
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
          {["dashboard", "listproject", "payments", "about"].map((item, index) => (
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
                  : item === "payments"
                  ? "Payments"
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
                className="h-[5vmin] w-[5vmin] bg-[#00A8E8] rounded-full text-[2.3vmin] font-medium transition-all duration-300 flex items-center justify-center focus:outline-none overflow-hidden"
              >
                {userProfile?.user_profile_avatar ? (
                  <img 
                    src={userProfile.user_profile_avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    key="dropdown"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="absolute right-0 mt-2 w-64 bg-[#232323] rounded-lg shadow-xl border border-[#00A8E8]/30 z-50 overflow-hidden"
                  >
                    {/* User Profile Section */}
                    <div className="px-6 py-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-[#00A8E8] flex items-center justify-center">
                          {userProfile?.user_profile_avatar ? (
                            <img 
                              src={userProfile.user_profile_avatar} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-lg font-medium">
                              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {userProfile?.user_profile_bio ? userProfile.user_profile_bio.split(' ').slice(0, 2).join(' ') : (user?.name || user?.email || 'User')}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Status */}
                    {subscriptionStatus?.isActive && (
                      <div className="px-6 py-3 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Premium Status</span>
                          <PremiumBadge 
                            planName={subscriptionStatus.subscription?.planName || 'starter'}
                            planType={subscriptionStatus.subscription?.planType || 'monthly'}
                            size="small"
                          />
                        </div>
                      </div>
                    )}
                    
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
                    
                    {/* Subscription Management */}
                    <Link
                      to="/subscription"
                      className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {subscriptionStatus?.isActive ? 'Manage Subscription' : 'Upgrade to Premium'}
                    </Link>
                    
                    {/* Payment Center */}
                    <Link
                      to="/payments"
                      className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Payment Center
                    </Link>
                    
                    {/* Withdrawals */}
                    <Link
                      to="/withdrawals"
                      className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Withdrawals
                    </Link>
                    
                    {/* Platform Administrator Options */}
                    {user?.isPlatformAdmin && (
                      <Link
                        to="/listfreeproject"
                        className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        List Free Project
                      </Link>
                    )}
                    
                    {/* Admin Panel - Show for users who have listed projects or are platform admins */}
                    {(hasListedProjects || user?.isPlatformAdmin) && (
                      <Link
                        to={`/admin`}
                        className="block px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin Panel
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
