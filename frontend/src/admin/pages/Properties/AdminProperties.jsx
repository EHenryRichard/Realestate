import { PlusLg } from "react-bootstrap-icons";
import PropertiesTable from "../../components/tables/PropertiesTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminSearchInput from "../../components/ui/AdminSearchInput.jsx";
import AdminSelect from "../../components/ui/AdminSelect.jsx";
import { useAdminProperties } from "../../hooks/useAdminProperties.js";

function AdminProperties() {
  const { error, isLoading, properties, search, setSearch, setStatus, status } = useAdminProperties();

  return (
    <>
      <AdminPageHeader
        action={{ icon: PlusLg, label: "Add Property", to: "/admin/properties/create" }}
        title="Properties"
        subtitle="Search, filter, edit, feature, and prepare property records for backend persistence."
      />
      <AdminCard>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_14rem]">
          <AdminSearchInput label="Search properties" onChange={(event) => setSearch(event.target.value)} value={search} />
          <AdminSelect
            name="status"
            onChange={(event) => setStatus(event.target.value)}
            options={["available", "sold", "rented", "pending", "hidden"]}
            placeholder="All statuses"
            value={status}
          />
        </div>
        {isLoading ? <AdminLoader label="Loading properties" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <PropertiesTable properties={properties} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminProperties;
