import SettingsForm from "../../components/forms/SettingsForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import { useAdminSettings } from "../../hooks/useAdminSettings.js";

function AdminSettings() {
  const { error, isLoading, settings } = useAdminSettings();

  return (
    <>
      <AdminPageHeader title="Site Info" subtitle="Update the phone number, email, address, and other public details." />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading settings" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <SettingsForm settings={settings} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminSettings;
