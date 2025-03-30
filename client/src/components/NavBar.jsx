import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  
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

  const handleLogout = () => {
    logoutUser();
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
      boxShadow: "0px 0px 15px rgba(0, 168, 232, 0.7)"
    },
    tap: { scale: 0.95 }
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
              <Link to={`/${item}`} className="text-[2vmin] font-medium tracking-wide">
                {item === "dashboard" ? "Explore Projects" : 
                 item === "listproject" ? "List Project" : "About"}
              </Link>
              <motion.div
                className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00A8E8]"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.li>
          ))}
          
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            transition={{ delay: 0.3 }}
          >
            <Link to={user ? "/" : "/createaccount"}>
              <button
                onClick={user ? handleLogout : undefined}
                className="h-[5vmin] w-[22vmin] bg-[#00A8E8] rounded-[2vmin] text-[2.3vmin] font-medium transition-all duration-300 flex items-center justify-center"
              >
                {user ? "Logout" : "Create Account"}
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  {user ? "👋" : "→"}
                </motion.span>
              </button>
            </Link>
          </motion.div>
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
