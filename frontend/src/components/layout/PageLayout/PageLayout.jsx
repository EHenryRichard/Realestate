import Footer from "../Footer/Footer.jsx";
import Header from "../Header/Header.jsx";

function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}

export default PageLayout;
