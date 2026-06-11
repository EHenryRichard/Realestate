import AdminBadge from "../ui/AdminBadge.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function NewsletterTable({ subscribers }) {
  const columns = [
    {
      key: "email",
      label: "Email",
      render: (subscriber) => <span className="font-extrabold text-brand-forest">{subscriber.email}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (subscriber) => <AdminBadge tone={subscriber.status}>{subscriber.status}</AdminBadge>,
    },
    {
      key: "createdAt",
      label: "Created",
    },
  ];

  return <AdminTable columns={columns} rows={subscribers} />;
}

export default NewsletterTable;
