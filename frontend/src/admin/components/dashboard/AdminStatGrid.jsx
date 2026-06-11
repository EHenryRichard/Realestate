import AdminStatCard from "../ui/AdminStatCard.jsx";

function AdminStatGrid({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <AdminStatCard key={stat.id} {...stat} />
      ))}
    </div>
  );
}

export default AdminStatGrid;
