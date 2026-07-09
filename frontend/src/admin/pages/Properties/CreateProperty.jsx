import PropertyForm from "../../components/forms/PropertyForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateProperty() {
  return (
    <>
      <AdminPageHeader title="Add House or Land" subtitle="Fill in the details visitors need before they call or send a message." />
      <AdminCard>
        <PropertyForm />
      </AdminCard>
    </>
  );
}

export default CreateProperty;
