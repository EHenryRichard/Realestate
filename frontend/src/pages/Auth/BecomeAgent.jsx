import { useState } from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "../../config/siteConfig.js";
import { showError, showSuccess } from "../../utils/toast.jsx";
import { agentRequestApi } from "../../api/agentRequestApi.js";

// Public "Become an agent" application form. Submitting creates a pending request
// the admin reviews; if approved, the person is emailed a link to finish signup.
function BecomeAgent() {
  const [form, setForm] = useState({ email: "", fullName: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await agentRequestApi.submit(form);
      showSuccess(res?.message || "Request received.");
      setDone(true);
    } catch (error) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4 py-14">
      <section className="w-full rounded-xl border border-brand-forest/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Join the team</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-brand-forest">Become an agent</h1>

        {done ? (
          <>
            <h2 className="mt-4 text-lg font-extrabold text-brand-forest">Request received 🎉</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Thanks for your interest in joining {siteConfig.brandName}. Our team will review your
              request, and if approved you'll get an email with a link to finish setting up your agent
              account.
            </p>
            <Link className="mt-6 inline-block font-bold text-brand-gold hover:text-brand-emerald" to="/">
              Back to home
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Apply to list and manage properties with {siteConfig.brandName}. Tell us how to reach you;
              we'll email you a signup link once you're approved.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Email address *
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="email"
                  onChange={handleChange}
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Full name
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="fullName"
                  onChange={handleChange}
                  value={form.fullName}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Phone
                <input
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="phone"
                  onChange={handleChange}
                  type="tel"
                  value={form.phone}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-forest">
                Why do you want to join? (optional)
                <textarea
                  className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
                  name="message"
                  onChange={handleChange}
                  rows={4}
                  value={form.message}
                />
              </label>
              <button
                className="rounded-md bg-brand-forest px-4 py-2.5 font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
            <p className="mt-5 text-sm text-brand-muted">
              Already on the team?{" "}
              <Link className="font-bold text-brand-gold hover:text-brand-emerald" to="/agent-login">
                Agent sign in
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default BecomeAgent;
