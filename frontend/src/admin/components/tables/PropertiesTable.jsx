import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";
import { adminPropertyApi } from "../../api/adminPropertyApi.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { Trash } from "react-bootstrap-icons";

function PropertiesTable({ properties }) {
  const handleDelete = async (property) => {
    try {
      await adminPropertyApi.remove(property.id);
      showSuccess(`${property.title} has been deleted.`);
      reload();
    } catch (err) {
      showError(err.message);
    }
  };
  const columns = [
    {
      key: "title",
      label: "House / Land",
      render: (property) => (
        <div>
          <p className="font-extrabold text-brand-forest">{property.title}</p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">
            {property.location}
          </p>
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
      render: (property) => (
        <AdminBadge tone={property.status}>{property.status}</AdminBadge>
      ),
    },
   {
      key: "actions",
      label: "Actions",
      render: (property) => (
        <div className="flex items-center gap-2">
          <AdminButton
            size="sm"
            to={`/admin/properties/${property.id}/edit`}
            variant="outline"
          >
            Edit
          </AdminButton>
          
          <button
            className="grid h-8 w-8 place-items-center border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
            onClick={() => handleDelete(property)}
            title="Remove"
            type="button"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={properties} />;
}

export default PropertiesTable;
