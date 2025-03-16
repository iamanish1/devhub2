import { Routes, Route } from "react-router-dom";
import AboutPage from "../pages/Aboutpage";
import LandingPage from "../pages/LandingPage";
import ProjectListingPage from "../pages/ProjectListingPage";
import Authenticationpage from "../pages/AuthenticationPage";
import DashboardPage from "../pages/DashBoardPage";
import SingupPage from "../components/SignupPage";
import BidingPage from "../pages/BidingPage";
import BidingProporsalPage from "../pages/BidingProporsalPage";
import {AuthProvider} from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loginaccount" element={<SingupPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/createaccount" element={<Authenticationpage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/listproject" element={<ProjectListingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bidingPage" element={<BidingPage />} />
          <Route path="/bidingproposal" element={<BidingProporsalPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
