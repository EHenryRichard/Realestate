import { siteConfig } from "../../../config/siteConfig.js";

function AppLoader() {
  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden bg-brand-forest px-6 text-center text-white">
      <div className="flex flex-col items-center">
        <img
          alt={siteConfig.brandName}
          className="h-16 w-auto animate-pulse object-contain brightness-0 invert sm:h-20"
          src="/images/logo/logo.png"
        />
        <div className="loader-ring mt-8" aria-hidden="true" />
        <div className="loader-line mt-6 h-1 w-52 bg-white/10" aria-hidden="true" />
        <p className="mt-4 max-w-sm text-sm text-white/70">{siteConfig.tagline}</p>
      </div>
    </div>
  );
}

export default AppLoader;
