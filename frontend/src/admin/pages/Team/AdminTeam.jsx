import { Link } from "react-router-dom";
import { EyeFill, EyeSlashFill, PencilSquare, PlusLg, Trash } from "react-bootstrap-icons";
import { adminPath } from "../../../config/adminConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminTeamApi } from "../../api/adminTeamApi.js";
import { useAdminTeam } from "../../hooks/useAdminTeam.js";
import AdminBadge from "../../components/ui/AdminBadge.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function AdminTeam() {
  const { members, error, isLoading, reload } = useAdminTeam();

  const handleToggle = async (member) => {
    try {
      await adminTeamApi.toggleVisible(member.id);
      showSuccess(`${member.fullName} ${member.isVisible ? "hidden" : "shown"} on the website.`);
      reload();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove ${member.fullName} from the team page? This cannot be undone.`)) {
      return;
    }
    try {
      await adminTeamApi.remove(member.id);
      showSuccess(`${member.fullName} removed.`);
      reload();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <>
      <AdminPageHeader
        action={{ icon: PlusLg, label: "Add Member", to: adminPath("team/create") }}
        title="Our Team"
        subtitle="The people shown on the public Our Team page. Add, hide, or edit their details."
      />
      <AdminCard>
        {isLoading ? (
          <AdminLoader label="Loading team" />
        ) : error ? (
          <AdminErrorState message={error} />
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-brand-muted">No team members yet. Add your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-forest/10 text-left">
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Member</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Title</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Order</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">On site</th>
                  <th className="pb-3 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest/6">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        {member.photo ? (
                          <img alt={member.fullName} className="h-10 w-10 rounded-full object-cover" src={member.photo} />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-forest text-sm font-extrabold text-white">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-brand-forest">{member.fullName}</p>
                          {member.phone && <p className="text-xs text-brand-muted">{member.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-brand-muted">{member.title || "—"}</td>
                    <td className="py-4 pr-4 text-brand-muted">{member.sortOrder}</td>
                    <td className="py-4 pr-4">
                      <AdminBadge tone={member.isVisible ? "active" : "hidden"}>
                        {member.isVisible ? "Visible" : "Hidden"}
                      </AdminBadge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                          title="Edit"
                          to={adminPath(`team/${member.id}/edit`)}
                        >
                          <PencilSquare className="h-4 w-4" />
                        </Link>
                        <button
                          className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                          onClick={() => handleToggle(member)}
                          title={member.isVisible ? "Hide from website" : "Show on website"}
                          type="button"
                        >
                          {member.isVisible ? <EyeSlashFill className="h-4 w-4" /> : <EyeFill className="h-4 w-4" />}
                        </button>
                        <button
                          className="grid h-8 w-8 place-items-center border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                          onClick={() => handleDelete(member)}
                          title="Remove"
                          type="button"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
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

export default AdminTeam;
