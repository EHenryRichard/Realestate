import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminMobileDrawer from "./AdminMobileDrawer.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminTopbar from "./AdminTopbar.jsx";

function AdminLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-brand-cream/55 text-brand-charcoal">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <AdminSidebar />
      </div>
      <div className="lg:pl-72">
        <AdminTopbar onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="min-h-[calc(100dvh-4.5rem)] px-4 py-5 md:px-6">
          <Outlet />
        </main>
      </div>
      <AdminMobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

export default AdminLayout;
