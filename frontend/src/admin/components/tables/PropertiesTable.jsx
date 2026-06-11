import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function PropertiesTable({ properties }) {
  const columns = [
    {
      key: "title",
      label: "Property",
      render: (property) => (
        <div>
          <p className="font-extrabold text-brand-forest">{property.title}</p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">{property.location}</p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (property) => formatCurrency(property.price, property.currency),
    },
    {
      key: "type",
      label: "Type",
    },
    {
      key: "status",
      label: "Status",
      render: (property) => <AdminBadge tone={property.status}>{property.status}</AdminBadge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (property) => (
        <AdminButton size="sm" to={`/admin/properties/${property.id}/edit`} variant="outline">
          Edit
        </AdminButton>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={properties} />;
}

export default PropertiesTable;
