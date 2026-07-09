import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { adminMessageApi } from "../../api/adminMessageApi.js";
import { adminMessages } from "../../data/adminDashboardData.js";
import AdminBadge from "../../components/ui/AdminBadge.jsx";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function AdminMessageDetails() {
  const { id } = useParams();
  const [message, setMessage] = useState(() => adminMessages.find((item) => item.id === id));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setMessage(adminMessages.find((item) => item.id === id));
      return undefined;
    }

    let active = true;

    const loadMessage = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminMessageApi.getById(id);

        if (active) {
          setMessage(response?.data || null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setMessage(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadMessage();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <AdminPageHeader title="Message Details" subtitle={message ? message.fullName : "This message was not found."} />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading message" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && message ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-forest/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-bold text-brand-forest">{message.fullName}</h2>
                <p className="mt-1 text-sm text-brand-muted">{message.serviceInterestedIn}</p>
              </div>
              <AdminBadge tone={message.status}>{message.status}</AdminBadge>
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-extrabold text-brand-forest">Email</dt>
                <dd className="mt-1 text-brand-muted">{message.email}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-brand-forest">Phone</dt>
                <dd className="mt-1 text-brand-muted">{message.phone || "Not provided"}</dd>
              </div>
            </dl>
            <p className="border border-brand-forest/10 bg-brand-cream p-4 text-sm leading-6 text-brand-charcoal">
              {message.message}
            </p>
            <div className="flex flex-wrap gap-3">
              <AdminButton href={`mailto:${message.email}`} variant="dark">
                Email Client
              </AdminButton>
              {message.phone ? (
                <AdminButton href={`tel:${message.phone}`} variant="outline">
                  Call Client
                </AdminButton>
              ) : null}
              <AdminButton to="/admin/messages" variant="outline">
                Back to Messages
              </AdminButton>
            </div>
          </div>
        ) : null}
        {!isLoading && !error && !message ? (
          <AdminButton to="/admin/messages">Back to Messages</AdminButton>
        ) : null}
      </AdminCard>
    </>
  );
}

export default AdminMessageDetails;
