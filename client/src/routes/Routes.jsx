import { Routes, Route } from "react-router-dom";
import AboutPage from "../pages/Aboutpage";
import LandingPage from "../pages/LandingPage";
import ProjectListingPage from "../pages/ProjectListingPage";
import Authenticationpage from "../pages/AuthenticationPage";
import DashboardPage from "../pages/DashBoardPage";
import BidingPage from "../pages/BidingPage";
import BidingProporsalPage from "../pages/BidingProporsalPage";
import ProtectedRoute from "../components/ProtectedRoute";
import LoginAccountPage from "../pages/LoginAccountPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/createaccount" element={<Authenticationpage />} />
      <Route path="/loginaccount" element={<LoginAccountPage />} />
      <Route path="/about" element={<AboutPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/listproject" element={<ProjectListingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bidingPage/:_id" element={<BidingPage />} />
        <Route path="/bidingproposal/:_id" element={<BidingProporsalPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
