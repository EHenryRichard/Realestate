import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { adminPath } from "../../../config/adminConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAgentsApi } from "../../api/adminAgentsApi.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminImageUploader from "../../components/ui/AdminImageUploader.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminTextarea from "../../components/ui/AdminTextarea.jsx";

const ROLES = ["agent", "admin"];

function EditAgent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", role: "agent", isActive: true,
    phone: "", photo: "", title: "", bio: "", slug: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiConfig.useApi) { setLoading(false); return; }
    adminAgentsApi.getById(id)
      .then((res) => {
        const a = res?.data?.data || res?.data || {};
        setForm({
          fullName: a.fullName || "",
          email: a.email || "",
          role: a.role || "agent",
          isActive: a.isActive ?? true,
          phone: a.phone || "",
          photo: a.photo || "",
          title: a.title || "",
          bio: a.bio || "",
          slug: a.slug || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handle = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await adminAgentsApi.update(id, form);
      showSuccess("Team member updated.");
      navigate(adminPath("agents"));
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AdminLoader label="Loading team member" />;

  return (
    <>
      <AdminPageHeader subtitle="Update this staff member's details and access level." title="Edit Staff" />
      <AdminCard className="max-w-2xl">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput label="Full name" name="fullName" onChange={handle} required value={form.fullName} />
            <AdminInput disabled label="Email address" name="email" value={form.email} />
            <AdminInput label="Phone number" name="phone" onChange={handle} value={form.phone} />
            <AdminInput label="Job title" name="title" onChange={handle} placeholder="e.g. Real estate worker" value={form.title} />
            <AdminInput label="Page link name" name="slug" onChange={handle} placeholder="e.g. john-obi" value={form.slug} />
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-widest text-brand-forest">Role</label>
              <select
                className="w-full border border-brand-forest/15 bg-white px-3 py-2.5 text-sm text-brand-charcoal focus:border-brand-forest focus:outline-none"
                name="role"
                onChange={handle}
                value={form.role}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <AdminTextarea label="Short story for public profile" name="bio" onChange={handle} rows={4} value={form.bio} />
          <AdminImageUploader label="Profile photo" name="photo" onChange={handle} value={form.photo} />

          <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
            <input checked={form.isActive} className="h-4 w-4 accent-brand-forest" name="isActive" onChange={handle} type="checkbox" />
            Account is active (can log in)
          </label>

          {error && <div className="border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

          <div className="flex gap-3">
            <AdminButton disabled={submitting} type="submit">
              {submitting ? "Saving..." : "Save Changes"}
            </AdminButton>
            <AdminButton to={adminPath("agents")} variant="outline">Cancel</AdminButton>
          </div>
        </form>
      </AdminCard>
    </>
  );
}

export default EditAgent;
