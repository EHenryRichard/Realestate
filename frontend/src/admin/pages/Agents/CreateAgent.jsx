import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { adminPath } from "../../../config/adminConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAgentsApi } from "../../api/adminAgentsApi.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminTextarea from "../../components/ui/AdminTextarea.jsx";

const ROLES = ["agent", "admin"];

function CreateAgent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", role: "agent",
    phone: "", title: "", bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiConfig.useApi) { showSuccess("Payload ready."); return; }
    setSubmitting(true);
    setError("");
    try {
      await adminAgentsApi.create(form);
      showSuccess(`${form.fullName} added to the team.`);
      navigate(adminPath("agents"));
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader subtitle="Create a login for a new team member." title="Add Team Member" />
      <AdminCard className="max-w-2xl">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput label="Full name" name="fullName" onChange={handle} required value={form.fullName} />
            <AdminInput label="Email address" name="email" onChange={handle} required type="email" value={form.email} />
            <AdminInput label="Password (min 6 chars)" name="password" onChange={handle} required type="password" value={form.password} />
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-widest text-brand-forest">
                Role
              </label>
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
            <AdminInput label="Phone number" name="phone" onChange={handle} value={form.phone} />
            <AdminInput label="Job title (e.g. Property Agent)" name="title" onChange={handle} value={form.title} />
          </div>
          <AdminTextarea label="Bio (shown on public profile)" name="bio" onChange={handle} rows={4} value={form.bio} />

          {error && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <AdminButton disabled={submitting} type="submit">
              {submitting ? "Adding..." : "Add Team Member"}
            </AdminButton>
            <AdminButton to={adminPath("agents")} variant="outline">Cancel</AdminButton>
          </div>
        </form>
      </AdminCard>
    </>
  );
}

export default CreateAgent;
