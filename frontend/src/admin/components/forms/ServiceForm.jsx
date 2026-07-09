import { useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { slugify } from "../../../utils/slugify.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminServiceApi } from "../../api/adminServiceApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminImageUploader from "../ui/AdminImageUploader.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

function ServiceForm({ initialService, mode = "create" }) {
  const [formData, setFormData] = useState({
    title: initialService?.title || "",
    slug: initialService?.slug || "",
    shortDescription: initialService?.shortDescription || "",
    fullDescription: initialService?.fullDescription || "",
    iconKey: initialService?.iconKey || "briefcase",
    image: initialService?.image || "",
    features: Array.isArray(initialService?.features) ? initialService.features.join(", ") : initialService?.features || "",
    ctaText: initialService?.ctaText || "",
    link: initialService?.link || "/contact",
    isActive: initialService?.isActive ?? true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
      slug: name === "title" && !currentData.slug ? slugify(value) : currentData.slug,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      features: formData.features
        .split(",")
        .map((feature) => feature.trim())
        .filter(Boolean),
    };

    if (!apiConfig.useApi) {
      setMessage("Looks good. Saving is not ready yet.");
      showToast("Looks good. Saving is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "edit") {
        await adminServiceApi.update(initialService.id, payload);
      } else {
        await adminServiceApi.create(payload);
      }

      setMessage(`${mode === "edit" ? "Update" : "Create"} service saved successfully.`);
      showSuccess(`${mode === "edit" ? "Update" : "Create"} service saved successfully.`);
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
        <AdminInput label="Service name" name="title" onChange={handleChange} required value={formData.title} />
        <AdminInput label="Page link name" name="slug" onChange={handleChange} value={formData.slug} />
        <AdminInput label="Icon name" name="iconKey" onChange={handleChange} value={formData.iconKey} />
        <AdminInput label="Button text" name="ctaText" onChange={handleChange} value={formData.ctaText} />
        <AdminInput label="Button link" name="link" onChange={handleChange} value={formData.link} />
      </div>
      <AdminImageUploader label="Service image" name="image" onChange={handleChange} value={formData.image} />
      <AdminTextarea label="Short description" name="shortDescription" onChange={handleChange} required value={formData.shortDescription} />
      <AdminTextarea label="Full description" name="fullDescription" onChange={handleChange} required value={formData.fullDescription} />
      <AdminInput label="Features" name="features" onChange={handleChange} value={formData.features} />
      <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
        <input checked={formData.isActive} className="h-4 w-4 accent-brand-forest" name="isActive" onChange={handleChange} type="checkbox" />
        Show this service on the website
      </label>
      {message ? <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">{message}</div> : null}
      {error ? <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
      <div className="flex flex-wrap gap-3">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : mode === "edit" ? "Update Service" : "Add Service"}
        </AdminButton>
        <AdminButton to="/admin/services" variant="outline">
          Back to Help We Offer
        </AdminButton>
      </div>
    </form>
  );
}

export default ServiceForm;
