import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, HeartFill } from "react-bootstrap-icons";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { clientApi } from "../../api/clientApi.js";
import { showError, showSuccess } from "../../utils/toast.jsx";

// Logged-in client actions on a property page: save/unsave, record a "recently
// viewed" entry, and message an agent about this listing. For signed-out visitors
// it degrades to a gentle "sign in to save / message" prompt — browsing itself is
// never gated.
function PropertyClientActions({ propertyId, propertyTitle }) {
  const { client, isAuthenticated, isCheckingSession } = useClientAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const viewRecorded = useRef(false);

  // When signed in: record the view once, and find out if it's already saved.
  useEffect(() => {
    if (!isAuthenticated || !propertyId) return;

    if (!viewRecorded.current) {
      viewRecorded.current = true;
      clientApi.recordView(propertyId).catch(() => {});
    }

    let active = true;
    clientApi
      .listSaved()
      .then((res) => {
        if (active) {
          setSaved((res?.data || []).some((item) => item.id === propertyId));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated, propertyId]);

  const toggleSaved = async () => {
    setBusy(true);
    try {
      if (saved) {
        await clientApi.unsaveProperty(propertyId);
        setSaved(false);
      } else {
        await clientApi.saveProperty(propertyId);
        setSaved(true);
        showSuccess("Saved to your account.");
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const sendInquiry = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await clientApi.createInquiry({ propertyId, message: message.trim() });
      showSuccess("Your message has been sent to our team.");
      setMessage("");
    } catch (error) {
      showError(error.message);
    } finally {
      setSending(false);
    }
  };

  // Don't flash anything while the session is still being restored.
  if (isCheckingSession) return null;

  // Signed-out: nudge toward an account without blocking anything.
  if (!isAuthenticated) {
    return (
      <p className="mt-5 text-sm text-brand-muted">
        <Link className="font-bold text-brand-gold hover:text-brand-emerald" to="/login">
          Sign in
        </Link>{" "}
        to save this place and message our team from your account.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {client?.emailVerified ? (
        <button
          className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-bold transition ${
            saved
              ? "border-brand-gold bg-brand-gold/10 text-brand-forest"
              : "border-brand-forest/20 text-brand-forest hover:bg-brand-forest hover:text-white"
          }`}
          disabled={busy}
          onClick={toggleSaved}
          type="button"
        >
          {saved ? <HeartFill className="h-4 w-4 text-brand-gold" /> : <Heart className="h-4 w-4" />}
          {saved ? "Saved" : "Save this place"}
        </button>
      ) : (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Confirm your email before saving houses.{" "}
          <Link className="font-black underline" to="/dashboard">
            Go to your account
          </Link>
          .
        </p>
      )}

      <form className="grid gap-2" onSubmit={sendInquiry}>
        <label className="text-sm font-semibold text-brand-forest" htmlFor="inquiry-message">
          Message us about {propertyTitle}
        </label>
        <textarea
          className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-sm text-brand-charcoal focus:border-brand-forest focus:outline-none"
          id="inquiry-message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. Is this still available? I would like to see it."
          rows={3}
          value={message}
        />
        <button
          className="justify-self-start rounded-md bg-brand-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
          disabled={sending || !message.trim()}
          type="submit"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </div>
  );
}

export default PropertyClientActions;
