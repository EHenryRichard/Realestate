import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminRoutes from "../admin/routes/AdminRoutes.jsx";
import ClientProtectedRoute from "../components/auth/ClientProtectedRoute.jsx";
import PageLayout from "../components/layout/PageLayout/PageLayout.jsx";
import PageLoader from "../components/ui/PageLoader/PageLoader.jsx";
import { adminConfig } from "../config/adminConfig.js";
import { ClientAuthProvider } from "../hooks/useClientAuth.jsx";

const Home = lazy(() => import("../pages/Home/Home.jsx"));
const ClientLogin = lazy(() => import("../pages/Auth/ClientLogin.jsx"));
const ClientRegister = lazy(() => import("../pages/Auth/ClientRegister.jsx"));
const VerifyEmail = lazy(() => import("../pages/Auth/VerifyEmail.jsx"));
const ClientDashboard = lazy(() => import("../pages/Dashboard/ClientDashboard.jsx"));
const About = lazy(() => import("../pages/About/About.jsx"));
const Services = lazy(() => import("../pages/Services/Services.jsx"));
const Properties = lazy(() => import("../pages/Properties/Properties.jsx"));
const PropertyDetails = lazy(() => import("../pages/PropertyDetails/PropertyDetails.jsx"));
const SavedHouses = lazy(() => import("../pages/SavedHouses/SavedHouses.jsx"));
const Projects = lazy(() => import("../pages/Projects/Projects.jsx"));
const Contact = lazy(() => import("../pages/Contact/Contact.jsx"));
const Blog = lazy(() => import("../pages/Blog/Blog.jsx"));
const BlogPost = lazy(() => import("../pages/Blog/BlogPost.jsx"));
const Team = lazy(() => import("../pages/Agents/Team.jsx"));
const AgentProfile = lazy(() => import("../pages/Agents/AgentProfile.jsx"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound.jsx"));

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AdminRoutes />} path={`${adminConfig.basePath}/*`} />
        <Route
          element={
            <ClientAuthProvider>
              <PageLayout>
                <Routes>
                  <Route element={<Home />} index />
                  <Route element={<About />} path="about" />
                  <Route element={<Services />} path="services" />
                  <Route element={<Properties />} path="properties" />
                  <Route element={<PropertyDetails />} path="properties/:slug" />
                  <Route element={<SavedHouses />} path="saved-houses" />
                  <Route element={<Projects />} path="projects" />
                  <Route element={<Contact />} path="contact" />
                  <Route element={<Blog />} path="blog" />
                  <Route element={<BlogPost />} path="blog/:slug" />
                  <Route element={<Team />} path="agents" />
                  <Route element={<AgentProfile />} path="agents/:slug" />

                  {/* Client accounts */}
                  <Route element={<ClientLogin />} path="login" />
                  <Route element={<ClientRegister />} path="register" />
                  <Route element={<VerifyEmail />} path="verify-email" />
                  <Route element={<ClientProtectedRoute />}>
                    <Route element={<ClientDashboard />} path="dashboard" />
                  </Route>

                  <Route element={<NotFound />} path="*" />
                </Routes>
              </PageLayout>
            </ClientAuthProvider>
          }
          path="/*"
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
