function AdminLoader({ label = "Loading admin data" }) {
  return (
    <div className="grid min-h-48 place-items-center border border-brand-forest/10 bg-white">
      <div className="text-center">
        <span className="loader-ring mx-auto block" aria-hidden="true" />
        <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.01em] text-brand-forest">{label}</p>
      </div>
    </div>
  );
}

export default AdminLoader;
