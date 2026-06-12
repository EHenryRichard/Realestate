function AdminCard({ children, className = "" }) {
  return (
    <section
      className={`min-w-0 w-full max-w-full overflow-hidden border border-brand-forest/10 bg-white p-4 shadow-[0_16px_48px_rgba(6,63,44,0.08)] sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export default AdminCard;
