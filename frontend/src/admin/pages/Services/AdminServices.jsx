import { PlusLg } from "react-bootstrap-icons";
import ServicesTable from "../../components/tables/ServicesTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import { useAdminServices } from "../../hooks/useAdminServices.js";

function AdminServices() {
  const { error, isLoading, services } = useAdminServices();

  return (
    <>
      <AdminPageHeader
        action={{ icon: PlusLg, label: "Add Service", to: "/admin/services/create" }}
        title="Help We Offer"
        subtitle="Edit the ways Sureboy Realty can help visitors."
      />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading services" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <ServicesTable services={services} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminServices;
