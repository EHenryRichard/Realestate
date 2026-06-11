import ServiceForm from "../../components/forms/ServiceForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateService() {
  return (
    <>
      <AdminPageHeader title="Create Service" subtitle="Prepare a backend-ready service record." />
      <AdminCard>
        <ServiceForm />
      </AdminCard>
    </>
  );
}

export default CreateService;
