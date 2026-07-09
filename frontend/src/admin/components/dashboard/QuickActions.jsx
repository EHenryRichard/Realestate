import { getIcon } from "../../../config/iconConfig.js";
import AdminCard from "../ui/AdminCard.jsx";
import AdminButton from "../ui/AdminButton.jsx";

function QuickActions({ actions }) {
  return (
    <AdminCard>
      <h2 className="font-display text-2xl font-bold text-brand-forest">Common Tasks</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const Icon = getIcon(action.iconKey);

          return (
            <AdminButton className="justify-start" icon={Icon} key={action.id} to={action.href} variant="outline">
              {action.label}
            </AdminButton>
          );
        })}
      </div>
    </AdminCard>
  );
}

export default QuickActions;
