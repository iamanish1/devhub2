import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Ensure loading state
  const navigate = useNavigate();

  // Fetch user details from backend
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/getuser", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Session expired:", error);
      logoutUser();
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch user on page load
  useEffect(() => {
    fetchUser();
  }, []);

  // Login function
  const loginUser = (token) => {
    localStorage.setItem("token", token);
    fetchUser();
    navigate("/dashboard"); // Redirect after login ✅
  };

  // Logout function (removes token and redirects to /loginaccount)
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/loginaccount"); // Redirect to login page
  };

  // Axios Interceptor (auto logout if token expires)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logoutUser();
          alert("Session expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

 export const useAuth = ()=> useContext(AuthContext)

export default AuthContext;
