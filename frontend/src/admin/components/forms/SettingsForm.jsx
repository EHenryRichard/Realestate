import { useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminSettingsApi } from "../../api/adminSettingsApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

function SettingsForm({ settings }) {
  const [formData, setFormData] = useState({
    brandName: settings.brandName || "",
    tagline: settings.tagline || "",
    phone: settings.phone || "",
    email: settings.email || "",
    whatsappNumber: settings.whatsappNumber || "",
    address: settings.address || "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      whatsapp: formData.whatsappNumber,
    };

    if (!apiConfig.useApi) {
      setMessage("Settings payload is ready for backend persistence.");
      showToast("Settings payload is ready for backend persistence.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      await adminSettingsApi.update(payload);
      setMessage("Settings saved successfully.");
      showSuccess("Settings saved successfully.");
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
        <AdminInput label="Brand name" name="brandName" onChange={handleChange} value={formData.brandName} />
        <AdminInput label="Phone" name="phone" onChange={handleChange} value={formData.phone} />
        <AdminInput label="Email" name="email" onChange={handleChange} type="email" value={formData.email} />
        <AdminInput label="WhatsApp number" name="whatsappNumber" onChange={handleChange} value={formData.whatsappNumber} />
      </div>
      <AdminTextarea label="Tagline" name="tagline" onChange={handleChange} value={formData.tagline} />
      <AdminTextarea label="Address" name="address" onChange={handleChange} value={formData.address} />
      {message ? <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">{message}</div> : null}
      {error ? <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
      <AdminButton disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving..." : "Save Settings"}
      </AdminButton>
    </form>
  );
}

export default SettingsForm;
