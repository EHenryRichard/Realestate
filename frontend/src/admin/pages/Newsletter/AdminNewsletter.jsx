import NewsletterTable from "../../components/tables/NewsletterTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminSearchInput from "../../components/ui/AdminSearchInput.jsx";
import { useAdminNewsletter } from "../../hooks/useAdminNewsletter.js";

function AdminNewsletter() {
  const { error, isLoading, search, setSearch, subscribers } = useAdminNewsletter();

  return (
    <>
      <AdminPageHeader title="Email List" subtitle="See the people who asked to receive updates." />
      <AdminCard>
        <AdminSearchInput className="mb-4" label="Search subscribers" onChange={(event) => setSearch(event.target.value)} value={search} />
        {isLoading ? <AdminLoader label="Loading subscribers" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <NewsletterTable subscribers={subscribers} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminNewsletter;
