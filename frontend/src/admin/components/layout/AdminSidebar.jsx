import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BoxArrowRight, ChevronRight, PersonCircle } from "react-bootstrap-icons";
import { getIcon } from "../../../config/iconConfig.js";
import { apiConfig } from "../../../config/apiConfig.js";
import { siteConfig } from "../../../config/siteConfig.js";
import { adminConfig, adminPath } from "../../../config/adminConfig.js";
import { adminNavSections } from "../../data/adminNavLinks.js";
import { adminTeamApi } from "../../api/adminTeamApi.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";

const rowBase =
  "group flex min-h-12 items-center gap-3 px-3 text-sm transition hover:bg-white/6 hover:text-white";
const rowState = (isActive) => (isActive ? "bg-white/8 text-white" : "text-white/78");

// A single tappable navigation row (used for solo links and group children).
function NavRow({ to, end, icon: Icon, label, onNavigate, indented }) {
  return (
    <NavLink
      className={({ isActive }) => [rowBase, rowState(isActive), indented ? "pl-11" : ""].join(" ")}
      end={end}
      onClick={onNavigate}
      to={to}
    >
      {Icon ? (
        <span className="grid h-9 w-9 shrink-0 place-items-center text-white/64 transition group-hover:text-white">
          <Icon aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
        </span>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-white/45 transition group-hover:bg-white" />
        </span>
      )}
      <span className="min-w-0 truncate font-extrabold uppercase leading-tight tracking-[0.01em]">
        {label}
      </span>
    </NavLink>
  );
}

// A collapsible category: heading button + indented children (+ optional live agent list).
function NavGroup({ section, isOpen, onToggle, onNavigate, pathname }) {
  const GroupIcon = getIcon(section.iconKey);
  const ChildIconFor = (key) => (key ? getIcon(key) : null);

  const [agents, setAgents] = useState([]);
  const [loadedAgents, setLoadedAgents] = useState(false);

  // Lazy-load the individual team member list the first time the group opens.
  useEffect(() => {
    if (!section.showTeamList || !isOpen || loadedAgents || !apiConfig.useApi) {
      return;
    }
    let active = true;
    adminTeamApi
      .list()
      .then((res) => {
        if (active) {
          setAgents(res?.data?.data || res?.data || []);
          setLoadedAgents(true);
        }
      })
      .catch(() => {
        if (active) {
          setLoadedAgents(true);
        }
      });
    return () => {
      active = false;
    };
  }, [section.showTeamList, isOpen, loadedAgents]);

  const containsActive = section.items?.some((item) => pathname.startsWith(item.href));

  return (
    <div>
      <button
        aria-expanded={isOpen}
        className={[rowBase, "w-full", containsActive ? "text-white" : "text-white/78"].join(" ")}
        onClick={onToggle}
        type="button"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center text-white/64 transition group-hover:text-white">
          <GroupIcon aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-left font-extrabold uppercase leading-tight tracking-[0.06em]">
          {section.label}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="mt-0.5 grid gap-0.5 border-l border-white/10 pb-1 pl-1">
          {section.items.map((item) => (
            <NavRow
              icon={ChildIconFor(item.iconKey)}
              indented
              key={item.id}
              label={item.label}
              onNavigate={onNavigate}
              to={item.href}
            />
          ))}

          {section.showTeamList ? (
            <>
              <p className="px-3 pb-1 pt-3 pl-11 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/40">
                Their details
              </p>
              {agents.length === 0 ? (
                <p className="px-3 pb-1 pl-11 text-xs text-white/45">
                  {loadedAgents ? "No members yet." : "Loading…"}
                </p>
              ) : (
                agents.map((agent) => (
                  <NavLink
                    className={({ isActive }) => [rowBase, rowState(isActive), "pl-8"].join(" ")}
                    key={agent.id}
                    onClick={onNavigate}
                    to={adminPath(`team/${agent.id}/edit`)}
                  >
                    {agent.photo ? (
                      <img alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" src={agent.photo} />
                    ) : (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12 text-xs font-extrabold text-white/80">
                        {agent.fullName?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                    <span className="min-w-0 truncate font-semibold leading-tight">{agent.fullName}</span>
                  </NavLink>
                ))
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AdminSidebar({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminAuth();
  const role = admin?.role || "agent";

  const visibleSections = useMemo(
    () => adminNavSections.filter((section) => !section.roles || section.roles.includes(role)),
    [role],
  );

  // Track which groups are open; auto-open the one holding the current route.
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current };
      visibleSections.forEach((section) => {
        if (section.items?.some((item) => location.pathname.startsWith(item.href))) {
          next[section.id] = true;
        }
      });
      return next;
    });
  }, [location.pathname, visibleSections]);

  const toggleGroup = (id) =>
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate(adminPath("login"), { replace: true });
  };

  return (
    <aside className="flex h-full min-w-0 flex-col overflow-x-hidden border-r border-white/10 bg-brand-forest text-white">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-5">
        <img
          alt={siteConfig.brandName}
          className="h-10 w-auto object-contain brightness-0 invert"
          src="/images/logo/logo.png"
        />
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav aria-label="Admin navigation" className="drawer-scrollbar grid min-w-0 gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {visibleSections.map((section) =>
          section.items ? (
            <NavGroup
              isOpen={Boolean(openGroups[section.id])}
              key={section.id}
              onNavigate={onNavigate}
              onToggle={() => toggleGroup(section.id)}
              pathname={location.pathname}
              section={section}
            />
          ) : (
            <NavRow
              end={section.href === adminConfig.basePath}
              icon={getIcon(section.iconKey)}
              key={section.id}
              label={section.label}
              onNavigate={onNavigate}
              to={section.href}
            />
          ),
        )}
      </nav>

      {/* Bottom: profile + logout */}
      <div className="mt-auto border-t border-white/10 p-3 grid gap-1">
        <NavLink
          className={({ isActive }) =>
            [
              "group flex min-h-12 items-center gap-3 px-3 text-sm font-extrabold uppercase tracking-[0.01em] transition hover:bg-white/6 hover:text-white",
              isActive ? "bg-white/8 text-white" : "text-white/78",
            ].join(" ")
          }
          onClick={onNavigate}
          to={adminPath("profile")}
        >
          <PersonCircle aria-hidden="true" className="h-5 w-5 text-white/64 transition group-hover:text-white" />
          <span className="min-w-0">
            <span className="block truncate">{admin?.fullName || "My Profile"}</span>
            <span className="block text-xs font-normal normal-case text-white/50">{role}</span>
          </span>
        </NavLink>
        <button
          className="flex min-h-12 w-full items-center gap-3 px-3 text-sm font-extrabold uppercase tracking-[0.01em] text-white/78 transition hover:bg-brand-emerald hover:text-white focus:outline-none focus:ring-0"
          onClick={handleLogout}
          type="button"
        >
          <BoxArrowRight aria-hidden="true" className="h-5 w-5 text-white/64" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
