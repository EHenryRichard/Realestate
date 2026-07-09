import { PlusLg } from "react-bootstrap-icons";
import TestimonialsTable from "../../components/tables/TestimonialsTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import { useAdminTestimonials } from "../../hooks/useAdminTestimonials.js";

function AdminTestimonials() {
  const { error, isLoading, testimonials } = useAdminTestimonials();

  return (
    <>
      <AdminPageHeader
        action={{ icon: PlusLg, label: "Add Review", to: "/admin/testimonials/create" }}
        title="Customer Reviews"
        subtitle="Add or hide the good comments customers have shared."
      />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading testimonials" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <TestimonialsTable testimonials={testimonials} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminTestimonials;
