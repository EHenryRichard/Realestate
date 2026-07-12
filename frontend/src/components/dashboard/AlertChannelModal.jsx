import { useState } from "react";
import { Bell, Envelope, PhoneVibrate, X } from "react-bootstrap-icons";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { clientAuthApi } from "../../api/clientAuthApi.js";
import { showError, showSuccess } from "../../utils/toast.jsx";
import ClientPushToggle from "./ClientPushToggle.jsx";
import { savedChannel } from "./NotificationPreferences.jsx";

// First-visit prompt: asks a client who has never chosen how they want to hear
// about new matches. Dismissible, but reappears next visit until they choose
// (the backend treats "not chosen" as Both in the meantime, so nothing is
// missed). Choosing phone/both chains into the browser-enable step so the
// choice actually works.
const CHOICES = [
  { value: "push", icon: PhoneVibrate, label: "On my phone", hint: "A pop-up message on your phone or computer" },
  { value: "email", icon: Envelope, label: "By email", hint: "A message to your inbox" },
  { value: "both", icon: Bell, label: "Both", hint: "Pop-up and email" },
];

function AlertChannelModal() {
  const { client, setClient } = useClientAuth();
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  // After choosing phone/both we show the enable-on-this-device step.
  const [enableStep, setEnableStep] = useState(false);

  const prefs = client?.searchPreferences || {};
  const needsChoice = Boolean(client) && client.emailVerified && !savedChannel(prefs);

  if (!needsChoice || dismissed) {
    return null;
  }

  const choose = async (channel) => {
    setSaving(true);
    try {
      // Keep whatever filters they already saved; only set the channel.
      const res = await clientAuthApi.updateMe({ searchPreferences: { ...prefs, channel } });
      if (res?.data) setClient(res.data);
      showSuccess("Saved. You can change this anytime on your dashboard.");
      if (channel === "email") {
        setDismissed(true);
      } else {
        // Pop-ups also need the browser's permission — walk them through it.
        setEnableStep(true);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 h-full w-full bg-brand-forest/60"
        onClick={() => setDismissed(true)}
        type="button"
      />
      <div
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <button
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center text-brand-muted transition hover:text-brand-forest"
          onClick={() => setDismissed(true)}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        {!enableStep ? (
          <>
            <h2 className="pr-8 font-display text-xl font-bold text-brand-forest">
              How should we let you know?
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              When we find a house or land that matches what you want, how do you want us to tell you?
            </p>
            <div className="mt-5 grid gap-2">
              {CHOICES.map((choice) => (
                <button
                  className="flex items-start gap-3 rounded-lg border border-brand-forest/15 p-3.5 text-left transition hover:border-brand-forest hover:bg-brand-forest/5 disabled:opacity-60"
                  disabled={saving}
                  key={choice.value}
                  onClick={() => choose(choice.value)}
                  type="button"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-forest/10 text-brand-forest" aria-hidden="true">
                    <choice.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-forest">{choice.label}</span>
                    <span className="mt-0.5 block text-xs text-brand-muted">{choice.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-brand-muted">
              You can change this anytime under "New house and land alerts".
            </p>
          </>
        ) : (
          <>
            <h2 className="pr-8 font-display text-xl font-bold text-brand-forest">One more step</h2>
            <p className="mt-2 text-sm text-brand-muted">
              Turn on alerts on this phone/computer so we can reach you.
            </p>
            <div className="mt-4">
              <ClientPushToggle />
            </div>
            <button
              className="mt-4 w-full rounded-md bg-brand-forest px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-emerald"
              onClick={() => setDismissed(true)}
              type="button"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AlertChannelModal;
