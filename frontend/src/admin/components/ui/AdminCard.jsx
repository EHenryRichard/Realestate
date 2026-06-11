function AdminCard({ children, className = "" }) {
  return (
    <section className={`border border-brand-forest/10 bg-white p-5 shadow-[0_16px_48px_rgba(6,63,44,0.08)] ${className}`}>
      {children}
    </section>
  );
}

export default AdminCard;
