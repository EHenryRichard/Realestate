function AdminLoader({ label }) {
  if (!label) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-brand-forest">
        <div className="flex flex-col items-center gap-6">
          <img
            alt="Sureboy Realty"
            className="h-16 w-auto animate-pulse object-contain brightness-0 invert"
            src="/images/logo/logo.png"
          />
          <span aria-hidden="true" className="loader-ring" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-48 place-items-center border border-brand-forest/10 bg-white">
      <div className="text-center">
        <span aria-hidden="true" className="loader-ring mx-auto block" />
        <p className="mt-4 text-sm font-extrabold uppercase tracking-normal text-brand-forest">{label}</p>
      </div>
    </div>
  );
}

export default AdminLoader;
