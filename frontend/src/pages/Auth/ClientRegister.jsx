import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { showError, showSuccess } from "../../utils/toast.jsx";

// Public sign-up page. On success the user is logged straight in; a "confirm your
// email" message is sent in the background (they can use the site meanwhile).
function ClientRegister() {
  const navigate = useNavigate();
  const { isAuthenticated, isCheckingSession, register } = useClientAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isCheckingSession && isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    // Client-side check for fast feedback; the server enforces this too.
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      // register() logs the user straight in; the confirmation email is sent
      // in the background, so we can go to the dashboard immediately.
      await register(form);
      showSuccess("Account created! Check your email to confirm your address.");
      navigate("/dashboard", { replace: true });
    } catch (registerError) {
      setError(registerError.message);
      showError(registerError.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Small factory to keep the four near-identical inputs DRY.
  const field = (label, name, type = "text", required = true) => (
    <label className="grid gap-1 text-sm font-semibold text-brand-forest">
      {label}
      <input
        className="rounded-md border border-brand-forest/15 px-3 py-2.5 text-brand-charcoal focus:border-brand-forest focus:outline-none"
        name={name}
        onChange={handleChange}
        required={required}
        type={type}
        value={form[name]}
      />
    </label>
  );

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <section className="w-full rounded-xl border border-brand-forest/10 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-brand-forest">Create your account</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Save properties, get alerts for new listings, and contact agents directly.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {field("Full name", "fullName")}
          {field("Email address", "email", "email")}
          {field("Phone number (optional)", "phone", "tel", false)}
          {field("Password (min 6 characters)", "password", "password")}
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <button
            className="rounded-md bg-brand-forest px-4 py-2.5 font-bold text-white transition hover:bg-brand-emerald disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-brand-muted">
          Already have an account?{" "}
          <Link className="font-bold text-brand-gold hover:text-brand-emerald" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default ClientRegister;
