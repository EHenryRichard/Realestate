function SkeletonCard() {
  return (
    <div className="overflow-hidden border border-brand-forest/10 bg-white shadow-sm">
      <div className="h-56 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-5">
        <div className="h-4 w-24 animate-pulse bg-slate-200" />
        <div className="h-6 w-3/4 animate-pulse bg-slate-200" />
        <div className="h-4 w-full animate-pulse bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse bg-slate-200" />
      </div>
    </div>
  );
}

export default SkeletonCard;
