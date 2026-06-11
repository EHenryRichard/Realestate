import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function MessagesTable({ messages }) {
  const columns = [
    {
      key: "fullName",
      label: "Client",
      render: (message) => (
        <div>
          <p className="font-extrabold text-brand-forest">{message.fullName}</p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">{message.email}</p>
        </div>
      ),
    },
    {
      key: "serviceInterestedIn",
      label: "Service",
    },
    {
      key: "status",
      label: "Status",
      render: (message) => <AdminBadge tone={message.status}>{message.status}</AdminBadge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (message) => (
        <AdminButton size="sm" to={`/admin/messages/${message.id}`} variant="outline">
          View
        </AdminButton>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={messages} />;
}

export default MessagesTable;
