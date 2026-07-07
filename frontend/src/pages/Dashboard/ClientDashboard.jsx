import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { clientApi } from "../../api/clientApi.js";
import { clientAuthApi } from "../../api/clientAuthApi.js";
import NotificationPreferences from "../../components/dashboard/NotificationPreferences.jsx";
import ClientPushToggle from "../../components/dashboard/ClientPushToggle.jsx";
import { showError, showSuccess } from "../../utils/toast.jsx";

// Formats a price like ₦25,000,000 (no decimals).
const money = (value, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// A compact property row used in the Saved and Recently-viewed lists.
function PropertyRow({ item, onRemove }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Link className="shrink-0" to={`/properties/${item.slug}`}>
        <img
          alt={item.title}
          className="h-14 w-20 rounded-md object-cover"
          src={item.mainImage || "/images/logo/logo.png"}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          className="block truncate font-semibold text-brand-forest hover:text-brand-gold"
          to={`/properties/${item.slug}`}
        >
          {item.title}
        </Link>
        <p className="truncate text-xs text-brand-muted">{item.location}</p>
        <p className="text-sm font-bold text-brand-forest">{money(item.price, item.currency)}</p>
      </div>
      {onRemove && (
        <button
          className="shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
          onClick={() => onRemove(item.id)}
          type="button"
        >
          Remove
        </button>
      )}
    </li>
  );
}

// A reusable card wrapper with a title and count.
function Card({ title, count, children }) {
  return (
    <section className="rounded-xl border border-brand-forest/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-brand-forest">{title}</h2>
        <span className="rounded-full bg-brand-forest/5 px-2 py-0.5 text-xs font-bold text-brand-muted">
          {count}
        </span>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ClientDashboard() {
  const navigate = useNavigate();
  const { client, logout } = useClientAuth();
  // The three dashboard lists + UI flags.
  const [saved, setSaved] = useState([]);
  const [viewed, setViewed] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false); // "resend verification" button

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all three lists together; each response is { data: [...] }.
      const [savedRes, viewedRes, inquiriesRes] = await Promise.all([
        clientApi.listSaved(),
        clientApi.listViewed(),
        clientApi.listInquiries(),
      ]);
      setSaved(savedRes?.data || []);
      setViewed(viewedRes?.data || []);
      setInquiries(inquiriesRes?.data || []);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemoveSaved = async (propertyId) => {
    try {
      await clientApi.unsaveProperty(propertyId);
      // Optimistically drop it from the list instead of refetching everything.
      setSaved((current) => current.filter((item) => item.id !== propertyId));
    } catch (error) {
      showError(error.message);
    }
  };

  const handleLogout = async () => {
    await logout(); // clears the session + refresh cookie
    navigate("/", { replace: true });
  };

  // Re-send the "confirm your email" link from the unverified banner.
  const handleResend = async () => {
    if (!client?.email) return;
    setResending(true);
    try {
      const res = await clientAuthApi.resendVerification(client.email);
      showSuccess(res?.message || "Verification email sent.");
    } catch (error) {
      showError(error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-forest">
            Hi, {client?.fullName || "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-brand-muted">{client?.email}</p>
        </div>
        <button
          className="rounded-md border border-brand-forest/20 px-4 py-2 text-sm font-bold text-brand-forest transition hover:bg-brand-forest hover:text-white"
          onClick={handleLogout}
          type="button"
        >
          Log out
        </button>
      </div>

      {client && !client.emailVerified && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Please confirm your email address to secure your account.
          </p>
          <button
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
            disabled={resending}
            onClick={handleResend}
            type="button"
          >
            {resending ? "Sending..." : "Resend link"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-10 text-center text-sm text-brand-muted">Loading your dashboard…</p>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card count={saved.length} title="Saved properties">
            {saved.length === 0 ? (
              <p className="py-4 text-sm text-brand-muted">
                No saved properties yet.{" "}
                <Link className="font-bold text-brand-gold" to="/properties">
                  Browse listings
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-brand-forest/8">
                {saved.map((item) => (
                  <PropertyRow item={item} key={item.id} onRemove={handleRemoveSaved} />
                ))}
              </ul>
            )}
          </Card>

          <Card count={viewed.length} title="Recently viewed">
            {viewed.length === 0 ? (
              <p className="py-4 text-sm text-brand-muted">Properties you open will show up here.</p>
            ) : (
              <ul className="divide-y divide-brand-forest/8">
                {viewed.map((item) => (
                  <PropertyRow item={item} key={item.id} />
                ))}
              </ul>
            )}
          </Card>

          <Card count={inquiries.length} title="My inquiries">
            {inquiries.length === 0 ? (
              <p className="py-4 text-sm text-brand-muted">You haven't contacted any agents yet.</p>
            ) : (
              <ul className="divide-y divide-brand-forest/8">
                {inquiries.map((item) => (
                  <li className="py-3" key={item.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-brand-forest">
                        {item.propertySlug ? (
                          <Link className="hover:text-brand-gold" to={`/properties/${item.propertySlug}`}>
                            {item.propertyTitle}
                          </Link>
                        ) : (
                          "General inquiry"
                        )}
                      </p>
                      <span className="shrink-0 rounded-full bg-brand-forest/5 px-2 py-0.5 text-[11px] font-bold uppercase text-brand-muted">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{item.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <NotificationPreferences />
      <ClientPushToggle />
    </main>
  );
}

export default ClientDashboard;
