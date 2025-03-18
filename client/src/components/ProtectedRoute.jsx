import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ProtectedRoute = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>; // Prevent flickering while checking auth

    return user ? <Outlet /> : <Navigate to="/loginaccount" replace={true} />;
};

export default ProtectedRoute;
