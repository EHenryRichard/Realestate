import { Link } from "react-router-dom";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { adminPath } from "../../../config/adminConfig.js";
import { siteConfig } from "../../../config/siteConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCheckingSession, isAuthenticated, login } = useAdminAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = location.state?.from?.pathname || adminPath();

  if (!isCheckingSession && isAuthenticated) {
    return <Navigate replace to={adminPath()} />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(formData);
      showSuccess("Admin login successful.");
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
      showError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-brand-forest px-4 py-8 text-white">
      <section className="w-full max-w-md border border-white/12 bg-white p-6 text-brand-charcoal shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Admin Access</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-brand-forest">{siteConfig.brandName}</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Sign in to update houses, land, messages, customer reviews, the email list, and site information.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <AdminInput label="Email address" name="email" onChange={handleChange} required type="email" value={formData.email} />
          <AdminInput label="Password" name="password" onChange={handleChange} required type="password" value={formData.password} />
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <AdminButton disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign In"}
          </AdminButton>
        </form>
        <p className="mt-4 text-sm font-bold text-brand-muted">
          <Link className="text-brand-gold hover:text-brand-emerald" to={adminPath("forgot-password")}>
            Forgot password?
          </Link>
        </p>
        <p className="mt-5 text-sm font-bold text-brand-muted">
          Need the first admin account?{" "}
          <Link className="text-brand-gold hover:text-brand-emerald" to={adminPath("signup")}>
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}

export default AdminLogin;
