import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function FaqsTable({ faqs }) {
  const columns = [
    {
      key: "question",
      label: "Question",
      render: (faq) => (
        <div className="max-w-sm">
          <p className="font-extrabold text-brand-forest">{faq.question}</p>
          {faq.answer ? (
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-brand-muted">{faq.answer}</p>
          ) : (
            <p className="mt-1 text-xs font-semibold text-amber-600">No answer yet</p>
          )}
        </div>
      ),
    },
    {
      key: "sortOrder",
      label: "Order",
      render: (faq) => faq.sortOrder,
    },
    {
      key: "status",
      label: "Status",
      render: (faq) => (
        <div className="flex flex-wrap items-center gap-2">
          <AdminBadge tone={faq.isVisible ? "active" : "hidden"}>
            {faq.isVisible ? "Visible" : "Hidden"}
          </AdminBadge>
          <AdminBadge tone={faq.answer ? "active" : "unread"}>
            {faq.answer ? "Answered" : "Pending"}
          </AdminBadge>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (faq) => (
        <AdminButton size="sm" to={`/admin/faqs/${faq.id}/edit`} variant="outline">
          {faq.answer ? "Edit" : "Answer"}
        </AdminButton>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={faqs} />;
}

export default FaqsTable;
