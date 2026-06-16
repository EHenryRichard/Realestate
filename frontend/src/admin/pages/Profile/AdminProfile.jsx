import { useEffect, useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess } from "../../../utils/toast.jsx";
import { adminAgentsApi } from "../../api/adminAgentsApi.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminImageUploader from "../../components/ui/AdminImageUploader.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminTextarea from "../../components/ui/AdminTextarea.jsx";

function AdminProfile() {
  const { admin } = useAdminAuth();
  const [profile, setProfile] = useState({
    fullName: "", phone: "", photo: "", bio: "", title: "", slug: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!admin) return;
    setProfile({
      fullName: admin.fullName || "",
      phone: admin.phone || "",
      photo: admin.photo || "",
      bio: admin.bio || "",
      title: admin.title || "",
      slug: admin.slug || "",
    });
  }, [admin]);

  const handleProfile = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handlePassword = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    if (!apiConfig.useApi) { showSuccess("Profile update ready."); return; }
    setSubmittingProfile(true);
    setProfileError("");
    try {
      await adminAgentsApi.updateMe(profile);
      showSuccess("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message);
      showError(err.message);
    } finally {
      setSubmittingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (!apiConfig.useApi) { showSuccess("Password change ready."); return; }
    setSubmittingPassword(true);
    setPasswordError("");
    try {
      await adminAgentsApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      showSuccess("Password changed successfully.");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.message);
      showError(err.message);
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        subtitle={`Logged in as ${admin?.role || "agent"} · ${admin?.email || ""}`}
        title="My Profile"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Profile info */}
        <AdminCard>
          <h2 className="mb-5 text-sm font-extrabold uppercase tracking-widest text-brand-forest">
            Profile Information
          </h2>
          <form className="grid gap-4" onSubmit={submitProfile}>
            <AdminInput label="Full name" name="fullName" onChange={handleProfile} required value={profile.fullName} />
            <AdminInput label="Job title" name="title" onChange={handleProfile} placeholder="e.g. Property Agent" value={profile.title} />
            <AdminInput label="Phone number" name="phone" onChange={handleProfile} value={profile.phone} />
            {admin?.role === "agent" && (
              <AdminInput label="Slug (your public URL: /agents/your-slug)" name="slug" onChange={handleProfile} value={profile.slug} />
            )}
            <AdminTextarea label="Bio (visible on your public profile)" name="bio" onChange={handleProfile} rows={4} value={profile.bio} />
            <AdminImageUploader label="Profile photo" name="photo" onChange={handleProfile} value={profile.photo} />

            {profileError && (
              <div className="border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{profileError}</div>
            )}
            <AdminButton disabled={submittingProfile} type="submit">
              {submittingProfile ? "Saving..." : "Save Profile"}
            </AdminButton>
          </form>
        </AdminCard>

        {/* Change password */}
        <AdminCard>
          <h2 className="mb-5 text-sm font-extrabold uppercase tracking-widest text-brand-forest">
            Change Password
          </h2>
          <form className="grid gap-4" onSubmit={submitPassword}>
            <AdminInput
              label="Current password"
              name="currentPassword"
              onChange={handlePassword}
              required
              type="password"
              value={passwords.currentPassword}
            />
            <AdminInput
              label="New password (min 6 chars)"
              name="newPassword"
              onChange={handlePassword}
              required
              type="password"
              value={passwords.newPassword}
            />
            <AdminInput
              label="Confirm new password"
              name="confirmPassword"
              onChange={handlePassword}
              required
              type="password"
              value={passwords.confirmPassword}
            />
            {passwordError && (
              <div className="border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{passwordError}</div>
            )}
            <AdminButton disabled={submittingPassword} type="submit">
              {submittingPassword ? "Changing..." : "Change Password"}
            </AdminButton>
          </form>
        </AdminCard>
      </div>
    </>
  );
}

export default AdminProfile;
