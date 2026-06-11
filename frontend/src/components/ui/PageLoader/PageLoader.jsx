function PageLoader() {
  return (
    <div className="grid min-h-[55dvh] place-items-center overflow-hidden bg-white px-6 py-20">
      <div className="flex flex-col items-center text-center">
        <div className="loader-ring" aria-hidden="true" />
        <p className="mt-4 font-extrabold text-brand-forest">Loading page</p>
      </div>
    </div>
  );
}

export default PageLoader;
