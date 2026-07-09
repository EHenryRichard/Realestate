import { useState } from "react";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { clientAuthApi } from "../../api/clientAuthApi.js";
import { showError, showSuccess } from "../../utils/toast.jsx";

// Lets a client control new-listing email alerts and the saved-search filters
// used to match them. Saved into the account's `searchPreferences` JSON, which
// the backend reads when a new property is published.
const PROPERTY_TYPES = ["Apartment", "House", "Land", "Commercial", "Duplex"];

// Turns "Lekki, Port Harcourt" into ["Lekki", "Port Harcourt"].
const toList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function NotificationPreferences() {
  const { client, setClient } = useClientAuth();
  const prefs = client?.searchPreferences || {};

  const [form, setForm] = useState({
    emailAlerts: Boolean(prefs.emailAlerts),
    locations: Array.isArray(prefs.locations) ? prefs.locations.join(", ") : "",
    propertyTypes: Array.isArray(prefs.propertyTypes) ? prefs.propertyTypes : [],
    maxPrice: prefs.maxPrice ?? "",
    minBedrooms: prefs.minBedrooms ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Add/remove a property type from the selected set (multi-select chips).
  const toggleType = (type) => {
    setForm((current) => ({
      ...current,
      propertyTypes: current.propertyTypes.includes(type)
        ? current.propertyTypes.filter((item) => item !== type)
        : [...current.propertyTypes, type],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    // Shape the object the backend matcher reads. `...( … ? {x} : {} )` spreads
    // the numeric keys in only when set, so a blank field means "no limit"
    // rather than 0.
    const searchPreferences = {
      emailAlerts: form.emailAlerts,
      locations: toList(form.locations), // "A, B" → ["A","B"]
      propertyTypes: form.propertyTypes,
      ...(form.maxPrice !== "" ? { maxPrice: Number(form.maxPrice) } : {}),
      ...(form.minBedrooms !== "" ? { minBedrooms: Number(form.minBedrooms) } : {}),
    };

    try {
      // Persist onto the account's profile, then refresh the cached client so the
      // form reflects saved state on remount.
      const res = await clientAuthApi.updateMe({ searchPreferences });
      if (res?.data) setClient(res.data);
      showSuccess("Notification preferences saved.");
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-brand-forest/10 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-brand-forest">New house and land alerts</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Get an email when we add something that matches what you want.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-forest">
          <input
            checked={form.emailAlerts}
            className="h-4 w-4 accent-brand-forest"
            onChange={(event) => setForm((c) => ({ ...c, emailAlerts: event.target.checked }))}
            type="checkbox"
          />
          Email me when there is a match
        </label>

        <label className="grid gap-1 text-sm font-semibold text-brand-forest">
          Locations
          <input
            className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
            onChange={(event) => setForm((c) => ({ ...c, locations: event.target.value }))}
            placeholder="e.g. Port Harcourt, Delta, Lekki"
            value={form.locations}
          />
        </label>

        <div className="grid gap-1 text-sm font-semibold text-brand-forest">
          Types of places
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                  form.propertyTypes.includes(type)
                    ? "border-brand-forest bg-brand-forest text-white"
                    : "border-brand-forest/20 text-brand-forest hover:border-brand-forest"
                }`}
                key={type}
                onClick={() => toggleType(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-brand-forest">
            Highest price
            <input
              className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
              min="0"
              onChange={(event) => setForm((c) => ({ ...c, maxPrice: event.target.value }))}
              placeholder="Any"
              type="number"
              value={form.maxPrice}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-brand-forest">
            Lowest number of bedrooms
            <input
              className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
              min="0"
              onChange={(event) => setForm((c) => ({ ...c, minBedrooms: event.target.value }))}
              placeholder="Any"
              type="number"
              value={form.minBedrooms}
            />
          </label>
        </div>

        <button
          className="justify-self-start rounded-md bg-brand-forest px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Save Alerts"}
        </button>
      </form>
    </section>
  );
}

export default NotificationPreferences;
