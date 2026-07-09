import TestimonialForm from "../../components/forms/TestimonialForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateTestimonial() {
  return (
    <>
      <AdminPageHeader title="Add Customer Review" subtitle="Share a short comment from a happy customer." />
      <AdminCard>
        <TestimonialForm />
      </AdminCard>
    </>
  );
}

export default CreateTestimonial;
