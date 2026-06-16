function AdminLoader({ label = "Loading admin data" }) {
  return (
    <div className="grid min-h-64 w-full place-items-center bg-white p-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-forest shadow-sm">
          <img
            alt="Sureboy Realty"
            className="h-8 w-auto animate-pulse object-contain brightness-0 invert"
            src="/images/logo/logo.png"
          />
        </span>
        <span aria-hidden="true" className="loader-ring mt-5 block" />
        <p className="mt-3 text-xs font-extrabold uppercase tracking-widest text-brand-forest/70">
          {label}
        </p>
      </div>
    </div>
  );
}

export default AdminLoader;
