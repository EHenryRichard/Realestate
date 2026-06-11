import PropertyForm from "../../components/forms/PropertyForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateProperty() {
  return (
    <>
      <AdminPageHeader title="Create Property" subtitle="Add a listing payload that matches the public website and Rust API model." />
      <AdminCard>
        <PropertyForm />
      </AdminCard>
    </>
  );
}

export default CreateProperty;
