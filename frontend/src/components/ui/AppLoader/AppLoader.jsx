import { siteConfig } from "../../../config/siteConfig.js";

function AppLoader() {
  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden bg-brand-forest px-6 text-center text-white">
      <div className="flex flex-col items-center">
        <div className="loader-ring" aria-hidden="true" />
        <p className="mt-6 text-xl font-black tracking-[0]">{siteConfig.brandName}</p>
        <div className="loader-line mt-4 h-1 w-52 bg-white/10" aria-hidden="true" />
        <p className="mt-4 max-w-sm text-sm text-white/70">{siteConfig.tagline}</p>
      </div>
    </div>
  );
}

export default AppLoader;
