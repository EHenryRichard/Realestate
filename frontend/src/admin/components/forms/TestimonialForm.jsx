import { useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminTestimonialApi } from "../../api/adminTestimonialApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminImageUploader from "../ui/AdminImageUploader.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

function TestimonialForm({ initialTestimonial, mode = "create" }) {
  const [formData, setFormData] = useState({
    clientName: initialTestimonial?.clientName || "",
    clientRole: initialTestimonial?.clientRole || initialTestimonial?.clientType || "",
    serviceUsed: initialTestimonial?.serviceUsed || "",
    rating: initialTestimonial?.rating || 5,
    quote: initialTestimonial?.quote || "",
    avatar: initialTestimonial?.avatar || "",
    isVisible: initialTestimonial?.isVisible ?? true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      rating: Number(formData.rating || 5),
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
        await adminTestimonialApi.update(initialTestimonial.id, payload);
      } else {
        await adminTestimonialApi.create(payload);
      }

      setMessage(`${mode === "edit" ? "Review updated" : "Review added"} successfully.`);
      showSuccess(`${mode === "edit" ? "Review updated" : "Review added"} successfully.`);
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
        <AdminInput label="Customer name" name="clientName" onChange={handleChange} required value={formData.clientName} />
        <AdminInput label="Customer type" name="clientRole" onChange={handleChange} value={formData.clientRole} />
        <AdminInput label="Service used" name="serviceUsed" onChange={handleChange} value={formData.serviceUsed} />
        <AdminInput label="Rating" max="5" min="1" name="rating" onChange={handleChange} type="number" value={formData.rating} />
      </div>
      <AdminImageUploader label="Customer photo" name="avatar" onChange={handleChange} value={formData.avatar} />
      <AdminTextarea label="Customer comment" name="quote" onChange={handleChange} required value={formData.quote} />
      <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
        <input checked={formData.isVisible} className="h-4 w-4 accent-brand-forest" name="isVisible" onChange={handleChange} type="checkbox" />
        Show this review on the website
      </label>
      {message ? <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">{message}</div> : null}
      {error ? <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
      <div className="flex flex-wrap gap-3">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : mode === "edit" ? "Update Review" : "Add Review"}
        </AdminButton>
        <AdminButton to="/admin/testimonials" variant="outline">
          Back to Customer Reviews
        </AdminButton>
      </div>
    </form>
  );
}

export default TestimonialForm;
