import ServiceForm from "../../components/forms/ServiceForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateService() {
  return (
    <>
      <AdminPageHeader title="Add Help We Offer" subtitle="Explain one service in simple words visitors will understand." />
      <AdminCard>
        <ServiceForm />
      </AdminCard>
    </>
  );
}

export default CreateService;
