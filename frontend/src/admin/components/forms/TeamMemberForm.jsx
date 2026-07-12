import { useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminPath } from "../../../config/adminConfig.js";
import { adminTeamApi } from "../../api/adminTeamApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminImageUploader from "../ui/AdminImageUploader.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

function TeamMemberForm({ initialMember, mode = "create" }) {
  const [formData, setFormData] = useState({
    fullName: initialMember?.fullName || "",
    title: initialMember?.title || "",
    phone: initialMember?.phone || "",
    whatsapp: initialMember?.whatsapp || "",
    email: initialMember?.email || "",
    slug: initialMember?.slug || "",
    sortOrder: initialMember?.sortOrder ?? 0,
    bio: initialMember?.bio || "",
    photo: initialMember?.photo || "",
    isVisible: initialMember?.isVisible ?? true,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      sortOrder: Number(formData.sortOrder || 0),
    };

    if (!apiConfig.useApi) {
      showToast("Looks good. Saving is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (mode === "edit") {
        await adminTeamApi.update(initialMember.id, payload);
      } else {
        await adminTeamApi.create(payload);
      }
      showSuccess(`Team member ${mode === "edit" ? "updated" : "added"} successfully.`);
    } catch (caughtError) {
      setError(caughtError.message);
      showError(caughtError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <AdminInput label="Full name" name="fullName" onChange={handleChange} required value={formData.fullName} />
        <AdminInput label="Job title" name="title" onChange={handleChange} placeholder="e.g. Senior Property Agent" value={formData.title} />
        <AdminInput label="Phone" name="phone" onChange={handleChange} value={formData.phone} />
        <AdminInput label="WhatsApp number" name="whatsapp" onChange={handleChange} value={formData.whatsapp} />
        <AdminInput label="Email" name="email" onChange={handleChange} type="email" value={formData.email} />
        <AdminInput label="Display order (lower shows first)" min="0" name="sortOrder" onChange={handleChange} type="number" value={formData.sortOrder} />
      </div>
      <AdminInput
        label="Page link name (optional — made from the name if blank)"
        name="slug"
        onChange={handleChange}
        placeholder="e.g. ifeanyi-okoro"
        value={formData.slug}
      />
      <AdminImageUploader label="Photo" name="photo" onChange={handleChange} value={formData.photo} />
      <AdminTextarea label="Short bio for the public profile" name="bio" onChange={handleChange} value={formData.bio} />
      <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
        <input checked={formData.isVisible} className="h-4 w-4 accent-brand-forest" name="isVisible" onChange={handleChange} type="checkbox" />
        Show this person on the Our Team page
      </label>
      {error ? <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
      <div className="flex flex-wrap gap-3">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : mode === "edit" ? "Update Member" : "Add Member"}
        </AdminButton>
        <AdminButton to={adminPath("team")} variant="outline">
          Back to Our Team
        </AdminButton>
      </div>
    </form>
  );
}

export default TeamMemberForm;
