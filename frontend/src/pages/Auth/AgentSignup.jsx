import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminPath } from "../../config/adminConfig.js";
import { siteConfig } from "../../config/siteConfig.js";
import { showError, showSuccess } from "../../utils/toast.jsx";
import { agentRequestApi } from "../../api/agentRequestApi.js";

// Completes an agent account from the emailed invite link (?token=…). The email
// is fixed by the token; the person just sets their name + password.
function AgentSignup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ fullName: "", password: "", confirm: "", phone: "", title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await agentRequestApi.completeSignup({
        token,
        fullName: form.fullName,
        password: form.password,
        phone: form.phone,
        title: form.title,
      });
      showSuccess("Your agent account is ready!");
      setDone(true);
    } catch (signupError) {
      setError(signupError.message);
      showError(signupError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-14">
      <section className="w-full rounded-xl border border-brand-forest/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Agent signup</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-brand-forest">{siteConfig.brandName}</h1>

        {!token ? (
          <div className="mt-6 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
            This signup link is invalid or incomplete. Please use the link from your approval email.
          </div>
        ) : done ? (
          <>
            <h2 className="mt-4 text-lg font-extrabold text-brand-forest">You're all set 🎉</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Your agent account has been created. You can now log in to the dashboard.
            </p>
            <Link
              className="mt-6 inline-block rounded-md bg-brand-forest px-5 py-2.5 font-bold text-white hover:bg-brand-emerald"
              to={adminPath("agent-login")}
            >
              Go to login
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Finish setting up your agent account.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Full name *
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="fullName"
                  onChange={handleChange}
                  required
                  value={form.fullName}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Job title (optional)
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="title"
                  onChange={handleChange}
                  placeholder="e.g. Property Agent"
                  value={form.title}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Phone (optional)
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="phone"
                  onChange={handleChange}
                  type="tel"
                  value={form.phone}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Password (min 6 chars) *
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="password"
                  onChange={handleChange}
                  required
                  type="password"
                  value={form.password}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Confirm password *
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="confirm"
                  onChange={handleChange}
                  required
                  type="password"
                  value={form.confirm}
                />
              </label>
              {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
              <button
                className="rounded-md bg-brand-forest px-4 py-2.5 font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Creating account..." : "Create my account"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default AgentSignup;
