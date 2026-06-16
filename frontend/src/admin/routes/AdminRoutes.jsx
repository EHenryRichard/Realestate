import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminProtectedRoute from "../components/layout/AdminProtectedRoute.jsx";
import AdminLoader from "../components/ui/AdminLoader.jsx";
import { AdminAuthProvider } from "../hooks/useAdminAuth.js";

const AdminLogin = lazy(() => import("../pages/Login/AdminLogin.jsx"));
const AdminSignup = lazy(() => import("../pages/Login/AdminSignup.jsx"));
const AdminDashboard = lazy(() => import("../pages/Dashboard/AdminDashboard.jsx"));
const AdminAgents = lazy(() => import("../pages/Agents/AdminAgents.jsx"));
const AdminProperties = lazy(() => import("../pages/Properties/AdminProperties.jsx"));
const CreateProperty = lazy(() => import("../pages/Properties/CreateProperty.jsx"));
const EditProperty = lazy(() => import("../pages/Properties/EditProperty.jsx"));
const AdminServices = lazy(() => import("../pages/Services/AdminServices.jsx"));
const CreateService = lazy(() => import("../pages/Services/CreateService.jsx"));
const EditService = lazy(() => import("../pages/Services/EditService.jsx"));
const AdminTestimonials = lazy(() => import("../pages/Testimonials/AdminTestimonials.jsx"));
const CreateTestimonial = lazy(() => import("../pages/Testimonials/CreateTestimonial.jsx"));
const EditTestimonial = lazy(() => import("../pages/Testimonials/EditTestimonial.jsx"));
const AdminFaqs = lazy(() => import("../pages/FAQs/AdminFaqs.jsx"));
const CreateFaq = lazy(() => import("../pages/FAQs/CreateFaq.jsx"));
const EditFaq = lazy(() => import("../pages/FAQs/EditFaq.jsx"));
const AdminBlog = lazy(() => import("../pages/Blog/AdminBlog.jsx"));
const CreateBlogPost = lazy(() => import("../pages/Blog/CreateBlogPost.jsx"));
const EditBlogPost = lazy(() => import("../pages/Blog/EditBlogPost.jsx"));
const AdminMessages = lazy(() => import("../pages/Messages/AdminMessages.jsx"));
const AdminMessageDetails = lazy(() => import("../pages/Messages/AdminMessageDetails.jsx"));
const AdminNewsletter = lazy(() => import("../pages/Newsletter/AdminNewsletter.jsx"));
const AdminSettings = lazy(() => import("../pages/Settings/AdminSettings.jsx"));

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<AdminLoader />}>
        <Routes>
          <Route element={<AdminLogin />} path="login" />
          <Route element={<AdminSignup />} path="signup" />
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route element={<AdminDashboard />} index />
              <Route element={<AdminAgents />} path="agents" />
              <Route element={<AdminProperties />} path="properties" />
              <Route element={<CreateProperty />} path="properties/create" />
              <Route element={<EditProperty />} path="properties/:id/edit" />
              <Route element={<AdminServices />} path="services" />
              <Route element={<CreateService />} path="services/create" />
              <Route element={<EditService />} path="services/:id/edit" />
              <Route element={<AdminTestimonials />} path="testimonials" />
              <Route element={<CreateTestimonial />} path="testimonials/create" />
              <Route element={<EditTestimonial />} path="testimonials/:id/edit" />
              <Route element={<AdminFaqs />} path="faqs" />
              <Route element={<CreateFaq />} path="faqs/create" />
              <Route element={<EditFaq />} path="faqs/:id/edit" />
              <Route element={<AdminBlog />} path="blog" />
              <Route element={<CreateBlogPost />} path="blog/create" />
              <Route element={<EditBlogPost />} path="blog/:id/edit" />
              <Route element={<AdminMessages />} path="messages" />
              <Route element={<AdminMessageDetails />} path="messages/:id" />
              <Route element={<AdminNewsletter />} path="newsletter" />
              <Route element={<AdminSettings />} path="settings" />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
}

export default AdminRoutes;
