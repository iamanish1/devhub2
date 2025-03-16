import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const API_URL = "http://localhost:8000/api"; // Change this if needed

  // ✅ Logout function
  const logout = useCallback(() => {
    console.log("Logging out...");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/loginaccount");
  }, [navigate]);

  // ✅ Fetch user function
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, staying on login.");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching user...");
      const res = await axios.get(`${API_URL}/getuser`, {
        headers: { authorization: `Bearer ${token}` },
      });

      console.log("User fetched:", res.data.user);
      setUser(res.data.user);
    } catch (error) {
      console.log("Error fetching user:", error.response?.data || error.message);
      logout();
    }

    setLoading(false);
  }, [logout]);

  // ✅ Login function
  const login = async (email, password) => {
    try {
      console.log("Logging in...");
      const res = await axios.post(`${API_URL}/login`, { email, password });

      console.log("Login response:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        console.log("Token stored:", localStorage.getItem("token"));
        await fetchUser();
        navigate("/dashboard");
        return { success: true };
      } else {
        console.log("No token received from backend!");
        return { success: false, message: "Invalid response from server" };
      }
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
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
