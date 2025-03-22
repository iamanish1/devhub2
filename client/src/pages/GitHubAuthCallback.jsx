import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GitHubAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        // Extract the code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          console.error("GitHub authentication failed: No code found");
          navigate("/login");
          return;
        }

        // Send the GitHub code to backend for token & user data
        const response = await axios.post("http://localhost:8000/api/github/login", { code });

        const { token, user } = response.data;

        // Store token & user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Redirect to dashboard
        navigate("/dashboard");
      } catch (error) {
        console.error("GitHub authentication error:", error);
        navigate("/login"); // Redirect to login page on failure
      }
    };

    fetchAuthData();
  }, [navigate]);

  return <div>Authenticating with GitHub...</div>;
};

export default GitHubAuthCallback;
