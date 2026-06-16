import FaqForm from "../../components/forms/FaqForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateFaq() {
  return (
    <>
      <AdminPageHeader
        subtitle="Save a question now and come back to add the answer anytime."
        title="Add FAQ"
      />
      <AdminCard>
        <FaqForm />
      </AdminCard>
    </>
  );
}

export default CreateFaq;
