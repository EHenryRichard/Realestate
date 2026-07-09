function AdminPagination({ label = "Page 1 of 1" }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-brand-forest/10 pt-4 text-sm font-bold text-brand-muted">
      <span>{label}</span>
      <span>More pages will show here when available.</span>
    </div>
  );
}

export default AdminPagination;
