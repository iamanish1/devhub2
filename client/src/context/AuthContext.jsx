import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "http://localhost:8000/api"; // Update if needed

  // ✅ Logout function
  const logout = useCallback(() => {
    console.log("🔴 Logging out...");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/loginaccount");
  }, [navigate]);

  // ✅ Fetch user function
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("❌ No token found in localStorage.");
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 Fetching user with token:", token);
      const res = await axios.get(`${API_URL}/getuser`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true, // ✅ Ensure this is included if required
      });

      console.log("✅ User fetched successfully:", res.data);
      setUser(res.data.user);
    } catch (error) {
      console.error("❌ Error fetching user:", error.response?.data || error.message);
      setUser(null); // ✅ Ensure user is reset on error

      if (error.response?.status === 401) {
        console.log("🔴 Token expired or invalid, logging out...");
        logout();
      }
    }

    setLoading(false); // Ensure this is set after everything is done
  }, [logout]);

  // ✅ Login function with proper redirection
  const login = async (email, password) => {
    try {
      console.log("🔵 Logging in...");
      const res = await axios.post(
        `${API_URL}/login`,
        { email, password },
        { withCredentials: true } // ✅ Ensure backend sets cookies
      );

      console.log("🟢 Login Response:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        console.log("✅ Token stored:", localStorage.getItem("token"));

        // Wait until the user is fetched before navigating
        await fetchUser();

        // Only redirect after user is fetched and state is updated
        console.log("➡️ Redirecting to dashboard...");
        navigate("/dashboard", { replace: true });

        return { success: true };
      } else {
        console.log("❌ No token received from backend!");
        return { success: false, message: "Invalid response from server" };
      }
    } catch (error) {
      console.log("❌ Login error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // ✅ Run fetchUser on app load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
