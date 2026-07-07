import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminPath } from "../../../config/adminConfig.js";
import { siteConfig } from "../../../config/siteConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAuthApi } from "../../api/adminAuthApi.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";

// "Set a new password" page — step 2 of the reset flow. The user arrives here by
// clicking the link in their email, which looks like `.../reset-password?token=…`.
function AdminResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Pull the one-time token out of the URL query string. No token => bad link.
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Generic change handler: updates whichever field (by its `name`) changed.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Client-side checks first — fast feedback before hitting the server.
    // (The server re-validates all of this too; never trust the client alone.)
    if (!token) {
      setError("This reset link is missing its token. Request a new link.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Send the token + new password. On success, bounce to the login page.
      const response = await adminAuthApi.resetPassword({ token, newPassword: form.newPassword });
      showSuccess(response?.message || "Password reset successfully.");
      navigate(adminPath("login"), { replace: true });
    } catch (resetError) {
      // e.g. expired/used link — the server's message is shown to the user.
      setError(resetError.message);
      showError(resetError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-brand-forest px-4 py-8 text-white">
      <section className="w-full max-w-md border border-white/12 bg-white p-6 text-brand-charcoal shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Admin Access</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-brand-forest">{siteConfig.brandName}</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">Choose a new password for your admin account.</p>

        {token ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <AdminInput
              label="New password (min 6 chars)"
              name="newPassword"
              onChange={handleChange}
              required
              type="password"
              value={form.newPassword}
            />
            <AdminInput
              label="Confirm new password"
              name="confirmPassword"
              onChange={handleChange}
              required
              type="password"
              value={form.confirmPassword}
            />
            {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
            <AdminButton disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Reset password"}
            </AdminButton>
          </form>
        ) : (
          <div className="mt-6 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
            This reset link is invalid or incomplete. Please request a new one.
          </div>
        )}

        <p className="mt-5 text-sm font-bold text-brand-muted">
          <Link className="text-brand-gold hover:text-brand-emerald" to={adminPath("forgot-password")}>
            Request a new link
          </Link>{" "}
          ·{" "}
          <Link className="text-brand-gold hover:text-brand-emerald" to={adminPath("login")}>
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default AdminResetPassword;
