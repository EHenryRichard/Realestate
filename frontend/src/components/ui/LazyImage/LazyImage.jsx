import { useState } from "react";

const LOGO = "/images/logo/logo.png";

function LazyImage({ src, alt, className = "" }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const hasSource = Boolean(src);
  const noImage = !hasSource || errored;

  const handleLoad = () => setLoaded(true);
  const handleError = (event) => {
    event.currentTarget.onerror = null;
    setErrored(true);
    setLoaded(true);
  };

  if (noImage) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-brand-forest p-8">
        <img
          alt={alt}
          className="h-full w-full max-h-20 object-contain opacity-60"
          src={LOGO}
        />
      </div>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-forest transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <img alt="" className="h-12 w-auto opacity-40" src={LOGO} />
      </div>

      <img
        alt={alt}
        className={[
          className,
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
        loading="lazy"
        onError={handleError}
        onLoad={handleLoad}
        src={src}
      />
    </>
  );
}

export default LazyImage;
