import FaqForm from "../../components/forms/FaqForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateFaq() {
  return (
    <>
      <AdminPageHeader
        subtitle="Write a question visitors often ask. You can add the answer now or later."
        title="Add Question"
      />
      <AdminCard>
        <FaqForm />
      </AdminCard>
    </>
  );
}

export default CreateFaq;
