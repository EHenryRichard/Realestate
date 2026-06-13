import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "react-bootstrap-icons";
import { apiConfig } from "../../../config/apiConfig.js";
import { pushConfig } from "../../../config/pushConfig.js";
import { adminNotificationApi } from "../../api/adminNotificationApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminCard from "../ui/AdminCard.jsx";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const getUnsupportedReason = () => {
  if (!apiConfig.useApi) {
    return "Lead alerts require API mode.";
  }

  if (!window.isSecureContext) {
    return "Lead alerts require HTTPS in production, or localhost during development.";
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "This browser does not support Web Push notifications.";
  }

  if (!pushConfig.vapidPublicKey.trim()) {
    return "VAPID public key is not configured for this build.";
  }

  return "";
};

function LeadAlertsControl() {
  const unsupportedReason = useMemo(() => getUnsupportedReason(), []);
  const [permission, setPermission] = useState(() => (typeof Notification === "undefined" ? "default" : Notification.permission));
  const [isEnabled, setIsEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshState = useCallback(async () => {
    if (unsupportedReason) {
      return;
    }

    setPermission(Notification.permission);

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();

    setIsEnabled(Boolean(subscription));
  }, [unsupportedReason]);

  useEffect(() => {
    refreshState().catch(() => {});
  }, [refreshState]);

  const enableAlerts = async () => {
    setIsBusy(true);
    setMessage("");
    setError("");

    try {
      if (unsupportedReason) {
        throw new Error(unsupportedReason);
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const nextPermission = await Notification.requestPermission();

      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pushConfig.vapidPublicKey.trim()),
        }));
      const subscriptionPayload = subscription.toJSON();

      if (!subscriptionPayload.endpoint || !subscriptionPayload.keys?.p256dh || !subscriptionPayload.keys?.auth) {
        throw new Error("Browser returned an incomplete push subscription.");
      }

      await adminNotificationApi.subscribe(subscriptionPayload);
      setIsEnabled(true);
      setMessage("Lead alerts are enabled on this browser.");
    } catch (caughtError) {
      setError(caughtError.message || "Could not enable lead alerts.");
    } finally {
      setIsBusy(false);
    }
  };

  const disableAlerts = async () => {
    setIsBusy(true);
    setMessage("");
    setError("");

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription?.endpoint) {
        await adminNotificationApi.unsubscribe({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setIsEnabled(false);
      setMessage("Lead alerts are disabled on this browser.");
    } catch (caughtError) {
      setError(caughtError.message || "Could not disable lead alerts.");
    } finally {
      setIsBusy(false);
    }
  };

  const statusText = unsupportedReason || (permission === "denied" ? "Notification permission is blocked in this browser." : isEnabled ? "Enabled" : "Not enabled");
  const canEnable = !unsupportedReason && permission !== "denied" && !isEnabled;

  return (
    <AdminCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-brand-gold/35 bg-brand-cream text-brand-gold">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-brand-forest">Lead Alerts</h2>
              <p className="mt-1 text-sm font-semibold text-brand-muted">{statusText}</p>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
            Enable browser push alerts for new contact enquiries and newsletter subscribers on this admin device.
          </p>
          {message ? <p className="mt-3 text-sm font-extrabold text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm font-extrabold text-red-700">{error}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isEnabled ? (
            <AdminButton disabled={isBusy} onClick={disableAlerts} variant="outline">
              Disable Alerts
            </AdminButton>
          ) : (
            <AdminButton disabled={!canEnable || isBusy} onClick={enableAlerts}>
              Enable Alerts
            </AdminButton>
          )}
        </div>
      </div>
    </AdminCard>
  );
}

export default LeadAlertsControl;
