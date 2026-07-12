import { useState } from "react";
import { Bell, BellSlash, Envelope, PhoneVibrate, X } from "react-bootstrap-icons";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { clientAuthApi } from "../../api/clientAuthApi.js";
import { showError, showSuccess } from "../../utils/toast.jsx";
import ClientPushToggle from "./ClientPushToggle.jsx";

// Lets a client control HOW we tell them about new matches (phone pop-up,
// email, both, or off) and the saved-search filters used to match listings.
// Saved into the account's `searchPreferences` JSON, which the backend reads
// when a new property is published.
const PROPERTY_TYPES = ["Apartment", "House", "Land", "Commercial", "Duplex"];

// The one clear channel choice. Values match what the backend reads.
export const CHANNEL_OPTIONS = [
  { value: "push", icon: PhoneVibrate, label: "On my phone", hint: "A pop-up message on your phone or computer" },
  { value: "email", icon: Envelope, label: "By email", hint: "A message to your inbox" },
  { value: "both", icon: Bell, label: "Both", hint: "Pop-up and email" },
  { value: "off", icon: BellSlash, label: "Don't send me alerts", hint: "You can turn this back on anytime" },
];

// Reads the saved channel, honouring accounts from before the picker existed:
// legacy `emailAlerts: true` means email-only; never-chosen stays "" so the
// first-time modal knows to ask.
export const savedChannel = (prefs = {}) => {
  if (["push", "email", "both", "off"].includes(prefs.channel)) return prefs.channel;
  if (prefs.emailAlerts) return "email";
  return "";
};

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
    // Unset shows as "both" here since that's how the backend treats it.
    channel: savedChannel(prefs) || "both",
    locations: Array.isArray(prefs.locations) ? prefs.locations.join(", ") : "",
    propertyTypes: Array.isArray(prefs.propertyTypes) ? prefs.propertyTypes : [],
    maxPrice: prefs.maxPrice ?? "",
    minBedrooms: prefs.minBedrooms ?? "",
  });
  const [saving, setSaving] = useState(false);
  // The channel picker lives in a pop-up; the panel just shows the current choice.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingChannel, setSavingChannel] = useState(false);

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
      channel: form.channel,
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

  // Picking in the pop-up saves right away (it's a single, discrete setting) so
  // the choice can't be lost by forgetting to hit Save.
  const chooseChannel = async (channel) => {
    setSavingChannel(true);
    try {
      const res = await clientAuthApi.updateMe({ searchPreferences: { ...prefs, channel } });
      if (res?.data) setClient(res.data);
      setForm((c) => ({ ...c, channel }));
      setPickerOpen(false);
      showSuccess("Saved. This is how we'll reach you.");
    } catch (error) {
      showError(error.message);
    } finally {
      setSavingChannel(false);
    }
  };

  const wantsPush = form.channel === "push" || form.channel === "both";
  const currentOption = CHANNEL_OPTIONS.find((option) => option.value === form.channel);

  return (
    <section className="mt-8 rounded-xl border border-brand-forest/10 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-brand-forest">New house and land alerts</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Tell us how to reach you when we add something that matches what you want.
      </p>

      <form className="mt-4 grid gap-5" onSubmit={handleSubmit}>
        {/* Channel: current choice + pop-up to change it */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-forest/15 bg-brand-cream/40 p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            {currentOption?.icon ? (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-forest text-white" aria-hidden="true">
                <currentOption.icon className="h-5 w-5" />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-muted">How we tell you about new matches</p>
              <p className="text-sm font-bold text-brand-forest">{currentOption?.label || "Both"}</p>
            </div>
          </div>
          <button
            className="shrink-0 rounded-md border border-brand-forest/20 px-4 py-2 text-sm font-bold text-brand-forest transition hover:bg-brand-forest hover:text-white"
            onClick={() => setPickerOpen(true)}
            type="button"
          >
            Change
          </button>
        </div>

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

        <p className="text-xs text-brand-muted">Leave these empty to hear about everything.</p>

        <button
          className="justify-self-start rounded-md bg-brand-forest px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Save Alerts"}
        </button>
      </form>

      {/* Pop-ups need the browser's permission too — surface the device toggle
          whenever their choice includes the phone. */}
      {wantsPush && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold text-brand-muted">
            Turn on alerts on this phone/computer so we can reach you.
          </p>
          <ClientPushToggle />
        </div>
      )}

      {/* Pop-up picker for the channel choice. */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            aria-label="Close"
            className="absolute inset-0 h-full w-full bg-brand-forest/60"
            onClick={() => setPickerOpen(false)}
            type="button"
          />
          <div aria-modal="true" className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" role="dialog">
            <button
              aria-label="Close"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center text-brand-muted transition hover:text-brand-forest"
              onClick={() => setPickerOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="pr-8 font-display text-xl font-bold text-brand-forest">How should we let you know?</h3>
            <p className="mt-2 text-sm text-brand-muted">
              When we find a house or land that matches what you want, how do you want us to tell you?
            </p>
            <div className="mt-5 grid gap-2">
              {CHANNEL_OPTIONS.map((option) => (
                <button
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition disabled:opacity-60 ${
                    form.channel === option.value
                      ? "border-brand-forest bg-brand-forest/5 ring-1 ring-brand-forest"
                      : "border-brand-forest/15 hover:border-brand-forest hover:bg-brand-forest/5"
                  }`}
                  disabled={savingChannel}
                  key={option.value}
                  onClick={() => chooseChannel(option.value)}
                  type="button"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-forest/10 text-brand-forest" aria-hidden="true">
                    <option.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-forest">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-brand-muted">{option.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default NotificationPreferences;
