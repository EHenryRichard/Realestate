import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminProtectedRoute from "../components/layout/AdminProtectedRoute.jsx";
import AdminLoader from "../components/ui/AdminLoader.jsx";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import { AdminAuthProvider } from "../hooks/useAdminAuth.js";
import { adminPath } from "../../config/adminConfig.js";

const AdminLogin        = lazy(() => import("../pages/Login/AdminLogin.jsx"));
const AdminSignup       = lazy(() => import("../pages/Login/AdminSignup.jsx"));
const AdminForgotPassword = lazy(() => import("../pages/Login/AdminForgotPassword.jsx"));
const AdminResetPassword  = lazy(() => import("../pages/Login/AdminResetPassword.jsx"));
const AdminDashboard    = lazy(() => import("../pages/Dashboard/AdminDashboard.jsx"));
const AdminAgents       = lazy(() => import("../pages/Agents/AdminAgents.jsx"));
const CreateAgent       = lazy(() => import("../pages/Agents/CreateAgent.jsx"));
const EditAgent         = lazy(() => import("../pages/Agents/EditAgent.jsx"));
const AdminUsers        = lazy(() => import("../pages/Users/AdminUsers.jsx"));
const AgentRequests     = lazy(() => import("../pages/Agents/AgentRequests.jsx"));
const AdminProfile      = lazy(() => import("../pages/Profile/AdminProfile.jsx"));
const AdminProperties   = lazy(() => import("../pages/Properties/AdminProperties.jsx"));
const CreateProperty    = lazy(() => import("../pages/Properties/CreateProperty.jsx"));
const EditProperty      = lazy(() => import("../pages/Properties/EditProperty.jsx"));
const AdminServices     = lazy(() => import("../pages/Services/AdminServices.jsx"));
const CreateService     = lazy(() => import("../pages/Services/CreateService.jsx"));
const EditService       = lazy(() => import("../pages/Services/EditService.jsx"));
const AdminTestimonials = lazy(() => import("../pages/Testimonials/AdminTestimonials.jsx"));
const CreateTestimonial = lazy(() => import("../pages/Testimonials/CreateTestimonial.jsx"));
const EditTestimonial   = lazy(() => import("../pages/Testimonials/EditTestimonial.jsx"));
const AdminFaqs         = lazy(() => import("../pages/FAQs/AdminFaqs.jsx"));
const CreateFaq         = lazy(() => import("../pages/FAQs/CreateFaq.jsx"));
const EditFaq           = lazy(() => import("../pages/FAQs/EditFaq.jsx"));
const AdminBlog         = lazy(() => import("../pages/Blog/AdminBlog.jsx"));
const CreateBlogPost    = lazy(() => import("../pages/Blog/CreateBlogPost.jsx"));
const EditBlogPost      = lazy(() => import("../pages/Blog/EditBlogPost.jsx"));
const AdminMessages     = lazy(() => import("../pages/Messages/AdminMessages.jsx"));
const AdminMessageDetails = lazy(() => import("../pages/Messages/AdminMessageDetails.jsx"));
const AdminNewsletter   = lazy(() => import("../pages/Newsletter/AdminNewsletter.jsx"));
const AdminSettings     = lazy(() => import("../pages/Settings/AdminSettings.jsx"));

// Redirects agents away from admin-only routes
function AdminOnlyRoute() {
  const { admin } = useAdminAuth();
  if (admin && admin.role !== "admin") {
    return <Navigate replace to={adminPath()} />;
  }
  return <Outlet />;
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<AdminLoader />}>
        <Routes>
          <Route element={<AdminLogin />} path="login" />
          <Route element={<AdminSignup />} path="signup" />
          <Route element={<AdminForgotPassword />} path="forgot-password" />
          <Route element={<AdminResetPassword />} path="reset-password" />
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              {/* ── Shared (admin + agent) ── */}
              <Route element={<AdminDashboard />} index />
              <Route element={<AdminProfile />} path="profile" />
              <Route element={<AdminProperties />} path="properties" />
              <Route element={<CreateProperty />} path="properties/create" />
              <Route element={<EditProperty />} path="properties/:id/edit" />
              <Route element={<AdminMessages />} path="messages" />
              <Route element={<AdminMessageDetails />} path="messages/:id" />

              {/* ── Admin only ── */}
              <Route element={<AdminOnlyRoute />}>
                <Route element={<AdminAgents />} path="agents" />
                <Route element={<CreateAgent />} path="agents/create" />
                <Route element={<EditAgent />} path="agents/:id/edit" />
                <Route element={<AdminUsers />} path="users" />
                <Route element={<AgentRequests />} path="agent-requests" />
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
                <Route element={<AdminNewsletter />} path="newsletter" />
                <Route element={<AdminSettings />} path="settings" />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
}

export default AdminRoutes;
