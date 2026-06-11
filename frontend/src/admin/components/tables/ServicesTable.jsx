import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function ServicesTable({ services }) {
  const columns = [
    {
      key: "title",
      label: "Service",
      render: (service) => (
        <div>
          <p className="font-extrabold text-brand-forest">{service.title}</p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">{service.shortDescription}</p>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (service) => <AdminBadge tone={service.isActive ? "active" : "hidden"}>{service.isActive ? "Active" : "Hidden"}</AdminBadge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (service) => (
        <AdminButton size="sm" to={`/admin/services/${service.id}/edit`} variant="outline">
          Edit
        </AdminButton>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={services} />;
}

export default ServicesTable;
