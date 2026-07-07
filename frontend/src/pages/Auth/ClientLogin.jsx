import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { showError, showSuccess } from "../../utils/toast.jsx";

// Public sign-in page for client accounts.
function ClientLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, isCheckingSession, login } = useClientAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already signed in (and the session check has finished)? Skip the form.
  if (!isCheckingSession && isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  // One handler for both inputs — updates the field named by the input.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // no full-page reload
    setError("");
    setSubmitting(true);
    try {
      await login(form); // stores the session in context on success
      showSuccess("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      // login() rejects with the server's message (e.g. "Invalid credentials").
      setError(loginError.message);
      showError(loginError.message);
    } finally {
      setSubmitting(false); // re-enable the button either way
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <section className="w-full rounded-xl border border-brand-forest/10 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-brand-forest">Sign in</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Access your saved properties, alerts, and inquiries.
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
            className="rounded-md bg-brand-forest px-4 py-2.5 font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-sm text-brand-muted">
          New here?{" "}
          <Link className="font-bold text-brand-gold hover:text-brand-emerald" to="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default ClientLogin;
