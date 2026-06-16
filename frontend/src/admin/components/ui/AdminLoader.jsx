function AdminLoader({ label = "Loading admin data" }) {
  return (
    <div className="grid min-h-64 place-items-center bg-brand-forest">
      <div className="flex flex-col items-center text-center">
        <img
          alt="Sureboy Realty"
          className="h-16 w-auto animate-pulse object-contain brightness-0 invert"
          src="/images/logo/logo.png"
        />
        <span aria-hidden="true" className="loader-ring mt-6 block" />
        <p className="mt-4 text-sm font-extrabold uppercase tracking-normal text-white/80">{label}</p>
      </div>
    </div>
  );
}

export default AdminLoader;
