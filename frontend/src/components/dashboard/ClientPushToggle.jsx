import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "react-bootstrap-icons";
import { pushConfig } from "../../config/pushConfig.js";
import { clientNotificationApi } from "../../api/clientNotificationApi.js";
import { showError, showSuccess } from "../../utils/toast.jsx";

// Web Push keys arrive base64url; the browser's subscribe() wants a Uint8Array.
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

// True on iPhone/iPad. iPadOS 13+ masquerades as a Mac, so we also treat a
// touch-capable "MacIntel" as iOS.
const isIosDevice = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|ad|od)/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// True when the site is running as an installed Home-Screen app (PWA) rather
// than in a normal browser tab.
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true);

// Explains why push can't be offered here (or "" when it can).
const unsupportedReason = () => {
  if (typeof window === "undefined" || !window.isSecureContext) {
    return "Phone alerts need HTTPS (or localhost while developing).";
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "This browser doesn't support push notifications.";
  }
  if (!pushConfig.vapidPublicKey.trim()) {
    return "Push isn't configured for this build.";
  }
  return "";
};

// Lets a signed-in client enable/disable browser + phone push alerts for new
// matching listings on THIS device. Mirrors the admin lead-alert control but for
// the public dashboard and the client push endpoints.
function ClientPushToggle() {
  const reason = useMemo(unsupportedReason, []);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification === "undefined" ? "default" : Notification.permission,
  );

  const refresh = useCallback(async () => {
    if (reason) return;
    setPermission(Notification.permission);
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    setEnabled(Boolean(subscription));
  }, [reason]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      if (reason) throw new Error(reason);
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") throw new Error("Notification permission was not granted.");

      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pushConfig.vapidPublicKey.trim()),
        }));

      const payload = subscription.toJSON();
      if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
        throw new Error("Browser returned an incomplete push subscription.");
      }

      await clientNotificationApi.subscribe(payload);
      setEnabled(true);
      showSuccess("Phone alerts enabled on this device.");
    } catch (error) {
      showError(error.message || "Could not enable phone alerts.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription?.endpoint) {
        await clientNotificationApi.unsubscribe({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setEnabled(false);
      showSuccess("Phone alerts disabled on this device.");
    } catch (error) {
      showError(error.message || "Could not disable phone alerts.");
    } finally {
      setBusy(false);
    }
  };

  // Human-readable status line, in priority order: unsupported → blocked →
  // enabled → not enabled.
  const status = reason
    ? reason
    : permission === "denied"
      ? "Notifications are blocked in this browser's settings."
      : enabled
        ? "Enabled on this device."
        : "Not enabled on this device.";
  // Only offer "Enable" when it's actually possible and not already on.
  const canEnable = !reason && permission !== "denied" && !enabled;

  // iOS only supports web push for apps added to the Home Screen (iOS 16.4+), NOT
  // in a normal Safari tab. For those users we hide the (non-functional) Enable
  // button and show install instructions instead. Email alerts still cover them.
  const needsIosInstall = isIosDevice() && !isStandalone();

  return (
    <section className="mt-4 rounded-xl border border-brand-forest/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-brand-gold/40 bg-brand-cream text-brand-gold">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-brand-forest">Phone / browser alerts</h3>
            <p className="text-sm text-brand-muted">
              {needsIosInstall
                ? "On iPhone/iPad, add this site to your Home Screen to turn on alerts."
                : status}
            </p>
          </div>
        </div>
        {/* No Enable button on an iOS Safari tab — it can't work there. */}
        {!needsIosInstall &&
          (enabled ? (
            <button
              className="rounded-md border border-brand-forest/20 px-4 py-2 text-sm font-bold text-brand-forest transition hover:bg-brand-forest hover:text-white disabled:opacity-60"
              disabled={busy}
              onClick={disable}
              type="button"
            >
              Disable
            </button>
          ) : (
            <button
              className="rounded-md bg-brand-forest px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
              disabled={!canEnable || busy}
              onClick={enable}
              type="button"
            >
              Enable
            </button>
          ))}
      </div>

      {/* Step-by-step Home-Screen install guide for iPhone/iPad users. */}
      {needsIosInstall && (
        <ol className="mt-4 list-decimal space-y-1 rounded-lg bg-brand-cream/50 p-4 pl-8 text-sm text-brand-forest">
          <li>Tap the <span className="font-bold">Share</span> button in Safari (the square with an up-arrow).</li>
          <li>Choose <span className="font-bold">Add to Home Screen</span>.</li>
          <li>Open Sureboy Realty from the new <span className="font-bold">Home Screen icon</span>.</li>
          <li>Come back to this page and tap <span className="font-bold">Enable</span> to allow alerts.</li>
          <li className="text-brand-muted">Requires iOS 16.4 or newer. You'll still receive <span className="font-semibold">email</span> alerts regardless.</li>
        </ol>
      )}
    </section>
  );
}

export default ClientPushToggle;
