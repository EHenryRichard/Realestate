import AdminStatGrid from "../../components/dashboard/AdminStatGrid.jsx";
import QuickActions from "../../components/dashboard/QuickActions.jsx";
import RecentMessages from "../../components/dashboard/RecentMessages.jsx";
import RecentProperties from "../../components/dashboard/RecentProperties.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import LeadAlertsControl from "../../components/dashboard/LeadAlertsControl.jsx";
import { useAdminDashboard } from "../../hooks/useAdminDashboard.js";

function AdminDashboard() {
  const { data, error, isLoading } = useAdminDashboard();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Manage the public website data from one clean control surface."
      />
      {isLoading ? <AdminLoader label="Loading dashboard" /> : null}
      {error ? <AdminErrorState message={error} /> : null}
      <div className="grid gap-5">
        <LeadAlertsControl />
        <AdminStatGrid stats={data.stats} />
        <QuickActions actions={data.quickActions} />
        <div className="grid gap-5 xl:grid-cols-2">
          <RecentProperties properties={data.recentProperties} />
          <RecentMessages messages={data.recentMessages} />
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
