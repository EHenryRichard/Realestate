import { X } from "react-bootstrap-icons";
import AdminSidebar from "./AdminSidebar.jsx";

function AdminMobileDrawer({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close admin navigation overlay"
        className="absolute inset-0 h-full w-full bg-brand-forest/70"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-y-0 left-0 w-[min(22rem,86vw)] shadow-2xl">
        <button
          aria-label="Close admin navigation"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center text-white hover:text-brand-gold focus:outline-none focus:ring-0"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-6 w-6" />
        </button>
        <AdminSidebar onNavigate={onClose} />
      </div>
    </div>
  );
}

export default AdminMobileDrawer;