import { useMemo, useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { slugify } from "../../../utils/slugify.js";
import { showError, showSuccess, showToast, showWarning } from "../../../utils/toast.jsx";
import { adminPropertyApi } from "../../api/adminPropertyApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminGalleryUploader from "../ui/AdminGalleryUploader.jsx";
import AdminImageUploader from "../ui/AdminImageUploader.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminSelect from "../ui/AdminSelect.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";
import AdminVideoUploader from "../ui/AdminVideoUploader.jsx";

const propertyStatusOptions = ["available", "sold", "rented", "pending", "hidden"];
const propertyTypeOptions = ["house", "apartment", "duplex", "land", "commercial", "shortlet", "estate"];

const normalizeProperty = (property = {}) => ({
  title: property.title || "",
  slug: property.slug || "",
  location: property.location || "",
  price: property.price || "",
  currency: property.currency || "NGN",
  type: String(property.type || property.propertyType || "house").toLowerCase(),
  status: String(property.status || "available").toLowerCase().replace("for sale", "available"),
  bedrooms: property.bedrooms || "",
  bathrooms: property.bathrooms || "",
  area: property.area || "",
  mainImage: property.mainImage || property.image || "",
  imageAlt: property.imageAlt || "",
  videos: Array.isArray(property.videos)
    ? property.videos
        .map((video) => ({
          url: String(video?.url || "").trim(),
          poster: String(video?.poster || "").trim(),
        }))
        .filter((video) => video.url)
    : [],
  galleryImages: Array.isArray(property.galleryImages || property.gallery)
    ? (property.galleryImages || property.gallery).join(", ")
    : property.galleryImages || "",
  description: property.description || "",
  features: Array.isArray(property.features) ? property.features.join(", ") : property.features || "",
  isFeatured: Boolean(property.isFeatured ?? property.featured),
});

function PropertyForm({ initialProperty, mode = "create" }) {
  const [formData, setFormData] = useState(() => normalizeProperty(initialProperty));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const title = mode === "edit" ? "Update House or Land" : "Add House or Land";

  const payloadPreview = useMemo(
    () => ({
      ...formData,
      slug: formData.slug || slugify(formData.title),
      price: Number(formData.price || 0),
      bedrooms: Number(formData.bedrooms || 0),
      bathrooms: Number(formData.bathrooms || 0),
      galleryImages: formData.galleryImages
        .split(",")
        .map((image) => image.trim())
        .filter(Boolean),
      features: formData.features
        .split(",")
        .map((feature) => feature.trim())
        .filter(Boolean),
    }),
    [formData],
  );

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
      slug: name === "title" && !currentData.slug ? slugify(value) : currentData.slug,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Please enter a name for this house or land.";
    }

    if (!formData.location.trim()) {
      nextErrors.location = "Location is required.";
    }

    if (!Number(formData.price)) {
      nextErrors.price = "Price must be greater than zero.";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      setSubmitMessage("");
      setSubmitError("");
      showWarning("Please fix the highlighted property fields.");
      return;
    }

    if (!apiConfig.useApi) {
      setSubmitMessage("Looks good. Saving is not ready yet.");
      showToast("Looks good. Saving is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    try {
      if (mode === "edit") {
        await adminPropertyApi.update(initialProperty.id, payloadPreview);
      } else {
        await adminPropertyApi.create(payloadPreview);
      }

      setSubmitMessage(`${title} saved successfully.`);
      showSuccess(`${title} saved successfully.`);
    } catch (caughtError) {
      setSubmitError(caughtError.message);
      showError(caughtError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid min-w-0 w-full max-w-full gap-5" onSubmit={handleSubmit}>
      <div className="grid min-w-0 max-w-full gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminInput error={errors.title} label="Name of house or land" name="title" onChange={handleChange} value={formData.title} />
        <AdminInput label="Page link name" name="slug" onChange={handleChange} value={formData.slug} />
        <AdminInput error={errors.location} label="Location" name="location" onChange={handleChange} value={formData.location} />
        <AdminInput error={errors.price} label="Price" name="price" onChange={handleChange} type="number" value={formData.price} />
        <AdminSelect
          label="Type"
          name="type"
          onChange={handleChange}
          options={propertyTypeOptions}
          value={formData.type}
        />
        <AdminSelect
          label="Status"
          name="status"
          onChange={handleChange}
          options={propertyStatusOptions}
          value={formData.status}
        />
        <AdminInput label="Bedrooms" name="bedrooms" onChange={handleChange} type="number" value={formData.bedrooms} />
        <AdminInput label="Bathrooms" name="bathrooms" onChange={handleChange} type="number" value={formData.bathrooms} />
        <AdminInput label="Area" name="area" onChange={handleChange} value={formData.area} />
        <AdminInput label="Image description for screen readers" name="imageAlt" onChange={handleChange} value={formData.imageAlt} />
      </div>

      <AdminTextarea
        error={errors.description}
        label="Description"
        name="description"
        onChange={handleChange}
        value={formData.description}
      />

      <div className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <AdminImageUploader name="mainImage" onChange={handleChange} value={formData.mainImage} />
        <AdminGalleryUploader name="galleryImages" onChange={handleChange} value={formData.galleryImages} />
        <AdminVideoUploader name="videos" onChange={handleChange} value={formData.videos} />
      </div>

      <AdminInput
        label="Features"
        name="features"
        onChange={handleChange}
        placeholder="Security, Parking, Modern kitchen"
        value={formData.features}
      />

      <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
        <input
          checked={formData.isFeatured}
          className="h-4 w-4 accent-brand-forest"
          name="isFeatured"
          onChange={handleChange}
          type="checkbox"
        />
        Mark as featured
      </label>

      {submitMessage ? (
        <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">
          {submitMessage}
        </div>
      ) : null}
      {submitError ? (
        <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">
          {submitError}
        </div>
      ) : null}

      <details className="min-w-0 max-w-full border border-brand-forest/10 bg-white p-4 text-xs text-brand-muted">
        <summary className="cursor-pointer font-extrabold uppercase text-brand-forest">Saved details preview</summary>
        <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(payloadPreview, null, 2)}
        </pre>
      </details>

      <div className="flex flex-wrap gap-3">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : title}
        </AdminButton>
        <AdminButton to="/admin/properties" variant="outline">
          Back to Houses & Land
        </AdminButton>
      </div>
    </form>
  );
}

export default PropertyForm;
