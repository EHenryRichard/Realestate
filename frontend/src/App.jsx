import { useEffect, useState } from "react";
import AppLoader from "./components/ui/AppLoader/AppLoader.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AppToaster } from "./utils/toast.jsx";

function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => setIsBooting(false), 650);
    return () => window.clearTimeout(bootTimer);
  }, []);

  if (isBooting) {
    return <AppLoader />;
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppToaster />
      <AppRoutes />
    </>
  );
}

export default App;
