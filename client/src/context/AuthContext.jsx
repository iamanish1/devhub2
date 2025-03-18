import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user details from backend
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
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
      logoutUser(); // Force logout if session expires
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch user on page load
  useEffect(() => {
    fetchUser();
  }, []);

  // Ensure proper redirection after loading
  useEffect(() => {
    if (!loading && !user && window.location.pathname !== "/") {
      navigate("/loginaccount", { replace: true });
    }
  }, [user, loading]);

  // Login function
  const loginUser = async (token) => {
    localStorage.setItem("token", token);
    await fetchUser();
    navigate("/dashboard", { replace: true });
  };

  // Logout function (redirects to home instead of login page)
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/", { replace: true }); // ✅ Redirect to home instead of login
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

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
