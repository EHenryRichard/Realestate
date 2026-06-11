import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { siteConfig } from "../../../config/siteConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";

function AdminSignup() {
  const navigate = useNavigate();
  const { isCheckingSession, isAuthenticated, signup } = useAdminAuth();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckingSession && isAuthenticated) {
    return <Navigate replace to="/admin" />;
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
      await signup(formData);
      showSuccess("Admin account created successfully.");
      navigate("/admin", { replace: true });
    } catch (signupError) {
      setError(signupError.message);
      showError(signupError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-brand-forest px-4 py-8 text-white">
      <section className="w-full max-w-md border border-white/12 bg-white p-6 text-brand-charcoal shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Create Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-brand-forest">{siteConfig.brandName}</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Create the first admin account. After that, new agents should be registered inside the dashboard.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <AdminInput label="Full name" name="fullName" onChange={handleChange} required value={formData.fullName} />
          <AdminInput label="Email address" name="email" onChange={handleChange} required type="email" value={formData.email} />
          <AdminInput label="Password" name="password" onChange={handleChange} required type="password" value={formData.password} />
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <AdminButton disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create Admin Account"}
          </AdminButton>
        </form>
        <p className="mt-5 text-sm font-bold text-brand-muted">
          Already have an account?{" "}
          <Link className="text-brand-gold hover:text-brand-emerald" to="/admin/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default AdminSignup;
