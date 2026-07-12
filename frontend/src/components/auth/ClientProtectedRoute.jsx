import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import PageLoader from "../ui/PageLoader/PageLoader.jsx";

// Wraps client-only routes. While we're still checking for a restored session we
// show the loader; once resolved, unauthenticated visitors are sent to /login.
function ClientProtectedRoute({ requireVerified = false }) {
  const { client, isAuthenticated, isCheckingSession } = useClientAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return <PageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  if (requireVerified && !client?.emailVerified) {
    return <Navigate replace state={{ from: location, verifyRequired: true }} to="/dashboard" />;
  }
  return <Outlet />;
}

export default ClientProtectedRoute;
