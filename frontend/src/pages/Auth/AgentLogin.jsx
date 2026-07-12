import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { PersonBadge } from "react-bootstrap-icons";
import { adminPath } from "../../config/adminConfig.js";
import { showError, showSuccess } from "../../utils/toast.jsx";
import { useAdminAuth } from "../../admin/hooks/useAdminAuth.js";

// Public sign-in page for AGENTS (staff with the agent role). It reuses the
// same session system as the admin panel, but this door is agents-only:
// super admins are turned away and pointed at the admin panel instead. After
// signing in the agent lands in their workspace (the panel already limits
// what the agent role can see and do).
function AgentLogin() {
  const navigate = useNavigate();
  const { admin, isAuthenticated, isCheckingSession, login, logout } = useAdminAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already signed in (agent OR admin)? This page has nothing for you — go to
  // the workspace, which enforces what each role can see. Keeps signed-in
  // admins from ever sitting on the agent form.
  if (!isCheckingSession && isAuthenticated && admin) {
    return <Navigate replace to={adminPath()} />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const account = await login(form);

      // Agents only — send admins to their own door.
      if (account?.role !== "agent") {
        await logout();
        throw new Error("This sign-in is for agents. Admins should use the admin panel link.");
      }

      showSuccess(`Welcome back, ${account.fullName?.split(" ")[0] || "agent"}!`);
      navigate(adminPath(), { replace: true });
    } catch (loginError) {
      setError(loginError.message);
      showError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 pb-12 pt-24 md:pt-28">
      <section className="w-full rounded-xl border border-brand-forest/10 bg-white p-6 shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-forest text-white" aria-hidden="true">
          <PersonBadge className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-brand-forest">Agent sign in</h1>
        <p className="mt-1 text-sm text-brand-muted">
          For Sureboy Realty agents: manage your listings and reply to customer messages.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm font-semibold text-brand-forest">
            Email address
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
            Password
            <input
              className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </label>
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <button
            className="rounded-md bg-brand-forest px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-sm text-brand-muted">
          Not on the team yet?{" "}
          <Link className="font-bold text-brand-gold hover:text-brand-emerald" to="/become-an-agent">
            Apply to join
          </Link>
        </p>
      </section>
    </main>
  );
}

export default AgentLogin;
