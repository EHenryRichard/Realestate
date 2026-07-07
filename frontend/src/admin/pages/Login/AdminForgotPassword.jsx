import { useState } from "react";
import { Link } from "react-router-dom";
import { adminPath } from "../../../config/adminConfig.js";
import { siteConfig } from "../../../config/siteConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAuthApi } from "../../api/adminAuthApi.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";

// "Forgot password?" page — step 1 of the reset flow. The user types their email
// and we ask the API to send a reset link. We deliberately show the same success
// screen whether or not the email exists (the server does the same), so this page
// can't be used to probe which emails are admins.
function AdminForgotPassword() {
  const [email, setEmail] = useState("");          // the email input value
  const [isSubmitting, setIsSubmitting] = useState(false); // disables the button while sending
  const [done, setDone] = useState(false);         // switches to the "check your inbox" view

  const handleSubmit = async (event) => {
    event.preventDefault();  // stop the browser's default full-page form submit
    setIsSubmitting(true);
    try {
      // Call the API. On success we flip to the confirmation screen.
      const response = await adminAuthApi.forgotPassword({ email });
      showSuccess(response?.message || "If that email exists, a reset link has been sent.");
      setDone(true);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsSubmitting(false); // always re-enable the button, success or fail
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-brand-forest px-4 py-8 text-white">
      <section className="w-full max-w-md border border-white/12 bg-white p-6 text-brand-charcoal shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Admin Access</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-brand-forest">{siteConfig.brandName}</h1>

        {done ? (
          <>
            <h2 className="mt-4 text-lg font-extrabold text-brand-forest">Check your inbox</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              If an admin account uses <span className="font-bold">{email}</span>, a password reset link is
              on its way. The link expires shortly, so use it soon.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Enter the email tied to your admin account and we'll send you a link to reset your password.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <AdminInput
                label="Email address"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
              <AdminButton disabled={isSubmitting} type="submit">
                {isSubmitting ? "Sending..." : "Send reset link"}
              </AdminButton>
            </form>
          </>
        )}

        <p className="mt-5 text-sm font-bold text-brand-muted">
          Remembered it?{" "}
          <Link className="text-brand-gold hover:text-brand-emerald" to={adminPath("login")}>
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default AdminForgotPassword;
