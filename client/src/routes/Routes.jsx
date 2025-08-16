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
import ProfilePage from "../pages/ProfilePage";
import EditProfilePage from "../pages/EditProfilePage";
import AdminPage from "../pages/AdminPage";
import ContributionPage from "../pages/ContributionPage";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfService from "../pages/TermsofServicePage";
import CookiePolicy from "../pages/CookiePolicy";
import CommunityGuidelines from "../pages/CommunityGuideline";
import Careers from "../pages/CarrerPage";
import Blog from "../pages/BlogPage";
import Contact from "../pages/ContactPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/createaccount" element={<Authenticationpage />} />
      <Route path="/loginaccount" element={<LoginAccountPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-service" element={<TermsOfService/>}/>
      <Route path="/cookie-policy" element={<CookiePolicy/>}/>
      <Route path="/community-guidelines" element={<CommunityGuidelines/>}/>
      <Route path="/careers" element={<Careers/>}/>
      <Route path="/blog" element={<Blog/>}/>
      <Route path="/contact" element={<Contact/>}/>
     

      <Route element={<ProtectedRoute />}>
        <Route path="/listproject" element={<ProjectListingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bidingPage/:_id" element={<BidingPage />} />
        <Route path="/bidingproposal/:_id" element={<BidingProporsalPage />} />
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/editprofile" element={<EditProfilePage/>}/>
        <Route path="/createprofile" element={<EditProfilePage/>}/>
        <Route path="/admin/" element={<AdminPage/>}/>
        <Route path="/editproject/:id" element={<ProjectListingPage />} />
        <Route path = "/contributionPage/:_id" element={<ContributionPage/>}/>
        
      </Route>
    </Routes>
  );
};

export default AppRoutes;
