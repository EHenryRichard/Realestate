import TestimonialForm from "../../components/forms/TestimonialForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateTestimonial() {
  return (
    <>
      <AdminPageHeader title="Create Testimonial" subtitle="Prepare a client story for homepage and testimonial sections." />
      <AdminCard>
        <TestimonialForm />
      </AdminCard>
    </>
  );
}

export default CreateTestimonial;
