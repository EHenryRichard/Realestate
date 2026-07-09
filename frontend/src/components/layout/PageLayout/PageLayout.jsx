import { useLocation } from "react-router-dom";
import BackToTop from "../../ui/BackToTop/BackToTop.jsx";
import WhatsAppButton from "../../ui/WhatsAppButton/WhatsAppButton.jsx";
import Footer from "../Footer/Footer.jsx";
import Header from "../Header/Header.jsx";

function PageLayout({ children }) {
  const { pathname } = useLocation();
  // The home page already has a back-to-top inside its SectionNavigator, so skip
  // the global one there to avoid two buttons.
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppButton />
      {!isHome && <BackToTop />}
    </div>
  );
}

export default PageLayout;
