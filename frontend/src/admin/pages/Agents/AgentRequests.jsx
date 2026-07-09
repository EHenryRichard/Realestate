import { useCallback, useEffect, useState } from "react";
import { CheckLg, XLg } from "react-bootstrap-icons";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAgentRequestsApi } from "../../api/adminAgentRequestsApi.js";
import AdminBadge from "../../components/ui/AdminBadge.jsx";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

const STATUS_TABS = ["pending", "approved", "completed", "rejected", "all"];
const STATUS_TONE = { pending: "unread", approved: "active", completed: "active", rejected: "hidden" };
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

// Admin review of "become an agent" applications: approve (emails the person a
// signup link) or reject.
function AgentRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!apiConfig.useApi) {
      setRequests([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await adminAgentRequestsApi.list({ status, limit: 50 });
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (request) => {
    if (!window.confirm(`Approve ${request.email}? They'll be emailed a signup link.`)) return;
    setBusyId(request.id);
    try {
      const res = await adminAgentRequestsApi.approve(request.id);
      showSuccess(res?.message || "Approved — invite emailed.");
      load();
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm(`Reject ${request.email}?`)) return;
    setBusyId(request.id);
    try {
      await adminAgentRequestsApi.reject(request.id);
      showSuccess("Request rejected.");
      load();
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <AdminPageHeader
        subtitle="People who asked to work with Sureboy. Approve only the ones you trust."
        title="Agent Forms"
      />

      <AdminCard>
        {/* Status filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition ${
                status === tab
                  ? "border-brand-forest bg-brand-forest text-white"
                  : "border-brand-forest/20 text-brand-forest hover:border-brand-forest"
              }`}
              key={tab}
              onClick={() => setStatus(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <AdminLoader label="Loading requests" />
        ) : error ? (
          <AdminErrorState message={error} />
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-brand-muted">No {status === "all" ? "" : status} requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-forest/10 text-left">
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Applicant</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Message</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Status</th>
                  <th className="pb-3 pr-4 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Requested</th>
                  <th className="pb-3 text-xs font-extrabold uppercase tracking-widest text-brand-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest/6">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="py-4 pr-4">
                      <p className="font-extrabold text-brand-forest">{request.fullName || "—"}</p>
                      <p className="text-xs text-brand-muted">{request.email}</p>
                      {request.phone && <p className="text-xs text-brand-muted">{request.phone}</p>}
                    </td>
                    <td className="max-w-xs py-4 pr-4 text-brand-muted">
                      <p className="line-clamp-2">{request.message || "—"}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <AdminBadge tone={STATUS_TONE[request.status] || "default"}>
                        {request.status}
                      </AdminBadge>
                    </td>
                    <td className="py-4 pr-4 text-brand-muted">{fmtDate(request.createdAt)}</td>
                    <td className="py-4">
                      {(request.status === "pending" || request.status === "approved") ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex items-center gap-1 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                            disabled={busyId === request.id}
                            onClick={() => handleApprove(request)}
                            title={request.status === "approved" ? "Re-send invite" : "Approve"}
                            type="button"
                          >
                            <CheckLg className="h-4 w-4" />
                            {request.status === "approved" ? "Resend" : "Approve"}
                          </button>
                          <button
                            className="inline-flex items-center gap-1 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                            disabled={busyId === request.id}
                            onClick={() => handleReject(request)}
                            type="button"
                          >
                            <XLg className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}

export default AgentRequests;
