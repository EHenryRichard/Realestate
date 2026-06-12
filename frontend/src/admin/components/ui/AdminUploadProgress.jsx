const formatElapsedTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (!minutes) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
};

function AdminUploadProgress({ elapsedSeconds, label = "Uploading", progress = 0 }) {
  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  const showElapsed = Number.isFinite(elapsedSeconds);

  return (
    <div className="mt-2 min-w-0 border border-brand-forest/10 bg-white p-2" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-extrabold uppercase text-brand-forest">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-brand-gold">{safeProgress}%</span>
      </div>
      <div className="h-2 overflow-hidden bg-brand-cream">
        <div className="h-full bg-brand-gold transition-all duration-200" style={{ width: `${safeProgress}%` }} />
      </div>
      {showElapsed ? (
        <p className="mt-2 text-xs font-bold text-brand-muted">Processing time: {formatElapsedTime(elapsedSeconds)}</p>
      ) : null}
    </div>
  );
}

export default AdminUploadProgress;
