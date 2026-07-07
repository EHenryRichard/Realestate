import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import PageLoader from "../ui/PageLoader/PageLoader.jsx";

// Wraps client-only routes (e.g. the dashboard). While we're still checking for a
// restored session we show the loader; once resolved, unauthenticated visitors
// are sent to /login (remembering where they were headed).
function ClientProtectedRoute() {
  const { isAuthenticated, isCheckingSession } = useClientAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return <PageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  return <Outlet />;
}

export default ClientProtectedRoute;
