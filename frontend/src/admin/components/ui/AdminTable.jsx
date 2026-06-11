import AdminEmptyState from "./AdminEmptyState.jsx";

function AdminTable({ columns, rows }) {
  if (!rows.length) {
    return <AdminEmptyState message="Try changing your search or filters." title="No matching records" />;
  }

  return (
    <div className="overflow-x-auto border border-brand-forest/10 bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-brand-forest text-white">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-[0.01em]" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-brand-forest/10 last:border-b-0" key={row.id}>
              {columns.map((column) => (
                <td className="px-4 py-3 align-top text-brand-charcoal" key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminTable;
