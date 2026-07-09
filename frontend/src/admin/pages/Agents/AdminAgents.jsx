import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PencilSquare, PersonXFill, PersonCheckFill, Trash } from "react-bootstrap-icons";
import { apiConfig } from "../../../config/apiConfig.js";
import { adminPath } from "../../../config/adminConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAgentsApi } from "../../api/adminAgentsApi.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import AdminBadge from "../../components/ui/AdminBadge.jsx";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

const ROLE_TONE = { admin: "active", agent: "unread" };

function AdminAgents() {
  const { admin } = useAdminAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Decides whether to show the delete button for a given row. Mirrors the exact
  // rules the backend enforces (the UI just hides what the API would reject):
  //   • never the primary founder (`!member.isPrimary`);
  //   • another admin only if *I* am the primary (`admin?.isPrimary`);
  //   • ordinary agents: always deletable by any admin.
  const canDelete = (member) =>
    !member.isPrimary && (member.role !== "admin" || Boolean(admin?.isPrimary));

  const load = async () => {
    if (!apiConfig.useApi) { setAgents([]); return; }
    setLoading(true);
    setError("");
    try {
      const res = await adminAgentsApi.list();
      setAgents(res?.data?.data || res?.data || []);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (agent) => {
    try {
      await adminAgentsApi.toggle(agent.id);
      showSuccess(`${agent.fullName} ${agent.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Remove ${agent.fullName} permanently? This cannot be undone.`)) return;
    try {
      await adminAgentsApi.remove(agent.id);
      showSuccess(`${agent.fullName} removed.`);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <>
      <AdminPageHeader
        action={<AdminButton to={adminPath("agents/create")}>+ Add Staff</AdminButton>}
        subtitle="Add or remove the people who can use this website manager."
        title="Staff"
      />

      <AdminCard>
        {loading ? (
          <AdminLoader label="Loading team" />
        ) : error ? (
          <AdminErrorState message={error} />
        ) : agents.length === 0 ? (
          <p className="py-8 text-center text-sm text-brand-muted">No team members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-forest/10 text-left">
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Member</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Role</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Title</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Status</th>
                  <th className="pb-3 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest/6">
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        {agent.photo ? (
                          <img alt={agent.fullName} className="h-10 w-10 rounded-full object-cover" src={agent.photo} />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center bg-brand-forest text-sm font-extrabold text-white">
                            {agent.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-brand-forest">{agent.fullName}</p>
                          <p className="text-xs text-brand-muted">{agent.email}</p>
                          {agent.phone && <p className="text-xs text-brand-muted">{agent.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AdminBadge tone={ROLE_TONE[agent.role] || "default"}>
                          {agent.role}
                        </AdminBadge>
                        {agent.isPrimary && <AdminBadge tone="active">primary</AdminBadge>}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-brand-muted">{agent.title || "—"}</td>
                    <td className="py-4 pr-4">
                      <AdminBadge tone={agent.isActive ? "active" : "hidden"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </AdminBadge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                          title="Edit"
                          to={adminPath(`agents/${agent.id}/edit`)}
                        >
                          <PencilSquare className="h-4 w-4" />
                        </Link>
                        {!agent.isPrimary && (
                          <button
                            className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                            onClick={() => handleToggle(agent)}
                            title={agent.isActive ? "Deactivate" : "Activate"}
                            type="button"
                          >
                            {agent.isActive
                              ? <PersonXFill className="h-4 w-4" />
                              : <PersonCheckFill className="h-4 w-4" />}
                          </button>
                        )}
                        {canDelete(agent) && (
                          <button
                            className="grid h-8 w-8 place-items-center border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                            onClick={() => handleDelete(agent)}
                            title="Remove"
                            type="button"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}

export default AdminAgents;
