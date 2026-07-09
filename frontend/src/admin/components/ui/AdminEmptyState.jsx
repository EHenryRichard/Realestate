function AdminEmptyState({ message = "Nothing to show here yet.", title = "No items yet" }) {
  return (
    <div className="border border-brand-forest/10 bg-white p-6 text-center">
      <p className="font-display text-2xl font-bold text-brand-forest">{title}</p>
      <p className="mt-2 text-sm text-brand-muted">{message}</p>
    </div>
  );
}

export default AdminEmptyState;
