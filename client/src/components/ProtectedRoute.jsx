import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext"; // Import your AuthContext

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>; // Wait for auth check to complete
  return user ? <Outlet /> : <Navigate to="/loginaccount" />;
};

export default ProtectedRoute;
