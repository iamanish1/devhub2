import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext"; // Make sure this is the correct path

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Loading...</p>; // Show a loading indicator while fetching user
  }

  return user ? children : <Navigate to="/loginaccount" />;
};

export default ProtectedRoute;
