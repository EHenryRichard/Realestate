import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function TestimonialsTable({ testimonials }) {
  const columns = [
    {
      key: "clientName",
      label: "Customer",
      render: (testimonial) => (
        <div>
          <p className="font-extrabold text-brand-forest">{testimonial.clientName}</p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">{testimonial.serviceUsed}</p>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (testimonial) => `${testimonial.rating}/5`,
    },
    {
      key: "isVisible",
      label: "Status",
      render: (testimonial) => (
        <AdminBadge tone={testimonial.isVisible ? "active" : "hidden"}>
          {testimonial.isVisible ? "Visible" : "Hidden"}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (testimonial) => (
        <AdminButton size="sm" to={`/admin/testimonials/${testimonial.id}/edit`} variant="outline">
          Edit
        </AdminButton>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={testimonials} />;
}

export default TestimonialsTable;
