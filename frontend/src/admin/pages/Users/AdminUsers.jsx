import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  PatchCheckFill,
  PatchExclamationFill,
  PersonCheckFill,
  PersonXFill,
  Search,
  Trash,
} from "react-bootstrap-icons";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminUsersApi } from "../../api/adminUsersApi.js";
import AdminBadge from "../../components/ui/AdminBadge.jsx";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

const PAGE_SIZE = 20;
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

// Admin page to view and manage the public/client accounts that sign up on the
// site — search, activate/deactivate, mark verified, edit, and delete.
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // the user open in the edit modal
  const [viewing, setViewing] = useState(null); // the user open in the details modal

  const load = useCallback(async () => {
    if (!apiConfig.useApi) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await adminUsersApi.list({ page, limit: PAGE_SIZE, search: search || undefined });
      setUsers(res?.data || []);
      setMeta(res?.meta || { page, totalPages: 1, total: (res?.data || []).length });
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Search resets to page 1.
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const handleToggle = async (user) => {
    try {
      await adminUsersApi.toggle(user.id);
      showSuccess(`${user.fullName} ${user.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleVerify = async (user) => {
    try {
      await adminUsersApi.update(user.id, { emailVerified: true });
      showSuccess(`${user.fullName} marked as verified.`);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.fullName} (${user.email})? This cannot be undone.`)) {
      return;
    }
    try {
      await adminUsersApi.remove(user.id);
      showSuccess(`${user.fullName} removed.`);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <>
      <AdminPageHeader
        subtitle="People who created an account on the website."
        title="Customers"
      />

      <AdminCard>
        {/* Search */}
        <form className="mb-4 flex items-center gap-2" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              className="w-full border border-brand-forest/15 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-charcoal focus:border-brand-forest focus:outline-none"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email…"
              value={search}
            />
          </div>
          <AdminButton type="submit">Search</AdminButton>
        </form>

        {loading ? (
          <AdminLoader label="Loading users" />
        ) : error ? (
          <AdminErrorState message={error} />
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-brand-muted">No users found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-forest/10 text-left">
                    <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Name</th>
                    <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Phone</th>
                    <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Email</th>
                    <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Status</th>
                    <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Joined</th>
                    <th className="pb-3 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-forest/6">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="py-4 pr-4">
                        <p className="font-extrabold text-brand-forest">
                          {user.fullName || user.full_name || user.name || "—"}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-brand-muted">{user.phone || "—"}</td>
                      <td className="py-4 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-brand-charcoal">
                          {user.email}
                          {/* Small status icon + native hover tooltip (green = verified,
                              amber = pending confirmation). */}
                          {user.emailVerified ? (
                            <PatchCheckFill
                              aria-label="Email verified"
                              className="h-4 w-4 shrink-0 text-emerald-600"
                              title="Verified"
                            />
                          ) : (
                            <PatchExclamationFill
                              aria-label="Email pending verification"
                              className="h-4 w-4 shrink-0 text-amber-500"
                              title="Pending verification"
                            />
                          )}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <AdminBadge tone={user.isActive ? "active" : "hidden"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </AdminBadge>
                      </td>
                      <td className="py-4 pr-4 text-brand-muted">{fmtDate(user.createdAt)}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {!user.emailVerified && (
                            <button
                              className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                              onClick={() => handleVerify(user)}
                              title="Mark email verified"
                              type="button"
                            >
                              <PatchCheckFill className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                            onClick={() => handleToggle(user)}
                            title={user.isActive ? "Deactivate" : "Activate"}
                            type="button"
                          >
                            {user.isActive
                              ? <PersonXFill className="h-4 w-4" />
                              : <PersonCheckFill className="h-4 w-4" />}
                          </button>
                          <button
                            className="grid h-8 w-8 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                            onClick={() => setViewing(user)}
                            title="View details"
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="border border-brand-forest/15 px-2.5 py-1 text-xs font-bold text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                            onClick={() => setEditing(user)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="grid h-8 w-8 place-items-center border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                            onClick={() => handleDelete(user)}
                            title="Delete"
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

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-brand-muted">
                {meta.total} user{meta.total === 1 ? "" : "s"} · page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <AdminButton
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  variant="outline"
                >
                  Prev
                </AdminButton>
                <AdminButton
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  variant="outline"
                >
                  Next
                </AdminButton>
              </div>
            </div>
          </>
        )}
      </AdminCard>

      {editing && (
        <EditUserModal
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          user={editing}
        />
      )}

      {viewing && <UserDetailsModal onClose={() => setViewing(null)} user={viewing} />}
    </>
  );
}

// Read-only modal: the user's activity (saved / viewed / inquiries / devices)
// and push status. Opened from the "eye" button in the row.
function UserDetailsModal({ user, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminUsersApi
      .getById(user.id)
      .then((res) => setDetail(res?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md border border-brand-forest/10 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-brand-forest">User details</h2>
        <p className="mt-1 text-sm font-semibold text-brand-forest">{user.fullName || "—"}</p>
        <p className="text-sm text-brand-muted">{user.email}</p>

        {loading ? (
          <p className="py-6 text-center text-sm text-brand-muted">Loading…</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              {[
                ["Saved", detail?.savedCount],
                ["Viewed", detail?.viewedCount],
                ["Inquiries", detail?.inquiryCount],
                ["Devices", detail?.pushCount],
              ].map(([label, value]) => (
                <div className="border border-brand-forest/10 bg-brand-cream/50 p-2" key={label}>
                  <p className="text-lg font-black text-brand-forest">{value ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-brand-muted">{label}</p>
                </div>
              ))}
            </div>
            {/* Push can only be enabled by the user on their own device. */}
            <p className="mt-3 text-sm">
              Push alerts:{" "}
              {(detail?.pushCount || 0) > 0 ? (
                <span className="font-bold text-emerald-700">
                  enabled on {detail.pushCount} device{detail.pushCount === 1 ? "" : "s"}
                </span>
              ) : (
                <span className="font-bold text-brand-muted">
                  not enabled (the user must turn this on from their own device)
                </span>
              )}
            </p>
            <div className="mt-3 grid gap-1 text-sm text-brand-muted">
              <p>Phone: <span className="text-brand-forest">{detail?.phone || user.phone || "—"}</span></p>
              <p>Email verified: <span className="text-brand-forest">{detail?.emailVerified ? "Yes" : "No"}</span></p>
              <p>Joined: <span className="text-brand-forest">{fmtDate(detail?.createdAt || user.createdAt)}</span></p>
            </div>
          </>
        )}

        <div className="mt-5 flex justify-end">
          <AdminButton onClick={onClose} type="button" variant="outline">Close</AdminButton>
        </div>
      </div>
    </div>
  );
}

// Edit modal: just the editable fields (name + phone). Activity/details live in
// the separate details modal.
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: user.fullName || "", phone: user.phone || "" });
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminUsersApi.update(user.id, { fullName: form.fullName, phone: form.phone });
      showSuccess("User updated.");
      onSaved();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md border border-brand-forest/10 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-brand-forest">Edit user</h2>
        <p className="mt-1 text-sm text-brand-muted">{user.email}</p>

        <form className="mt-5 grid gap-4" onSubmit={save}>
          <label className="grid gap-1 text-sm font-semibold text-brand-forest">
            Full name
            <input
              className="border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
              onChange={(event) => setForm((f) => ({ ...f, fullName: event.target.value }))}
              required
              value={form.fullName}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-brand-forest">
            Phone
            <input
              className="border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
              onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
              value={form.phone}
            />
          </label>
          <div className="flex gap-3">
            <AdminButton disabled={saving} type="submit">
              {saving ? "Saving…" : "Save changes"}
            </AdminButton>
            <AdminButton onClick={onClose} type="button" variant="outline">
              Cancel
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUsers;
