import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminRoutes from "../admin/routes/AdminRoutes.jsx";
import PageLayout from "../components/layout/PageLayout/PageLayout.jsx";
import PageLoader from "../components/ui/PageLoader/PageLoader.jsx";
import { adminConfig } from "../config/adminConfig.js";

const Home = lazy(() => import("../pages/Home/Home.jsx"));
const About = lazy(() => import("../pages/About/About.jsx"));
const Services = lazy(() => import("../pages/Services/Services.jsx"));
const Properties = lazy(() => import("../pages/Properties/Properties.jsx"));
const PropertyDetails = lazy(() => import("../pages/PropertyDetails/PropertyDetails.jsx"));
const SavedHouses = lazy(() => import("../pages/SavedHouses/SavedHouses.jsx"));
const Projects = lazy(() => import("../pages/Projects/Projects.jsx"));
const Contact = lazy(() => import("../pages/Contact/Contact.jsx"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound.jsx"));

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AdminRoutes />} path={`${adminConfig.basePath}/*`} />
        <Route
          element={
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
                <Route element={<NotFound />} path="*" />
              </Routes>
            </PageLayout>
          }
          path="/*"
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
