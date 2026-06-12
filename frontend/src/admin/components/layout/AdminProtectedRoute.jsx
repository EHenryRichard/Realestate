import { Navigate, Outlet, useLocation } from "react-router-dom";
import { adminPath } from "../../../config/adminConfig.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import AdminLoader from "../ui/AdminLoader.jsx";

function AdminProtectedRoute() {
  const location = useLocation();
  const { isCheckingSession, isAuthenticated } = useAdminAuth();

  if (isCheckingSession) {
    return <AdminLoader label="Checking admin session" />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={adminPath("login")} />;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;
