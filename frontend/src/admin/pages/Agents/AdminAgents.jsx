import { useEffect, useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminAuthApi } from "../../api/adminAuthApi.js";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminInput from "../../components/ui/AdminInput.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminTable from "../../components/ui/AdminTable.jsx";

function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", role: "agent" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadAgents = async () => {
    if (!apiConfig.useApi) {
      setAgents([]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await adminAuthApi.listAgents();
      setAgents(response?.data || []);
    } catch (caughtError) {
      setError(caughtError.message);
      showError(caughtError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

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
    setMessage("");

    if (!apiConfig.useApi) {
      setMessage("Agent payload is ready for the Rust API.");
      showToast("Agent payload is ready for the Rust API.");
      return;
    }

    setIsSubmitting(true);

    try {
      await adminAuthApi.registerAgent(formData);
      setFormData({ fullName: "", email: "", password: "", role: "agent" });
      setMessage("Agent registered successfully.");
      showSuccess("Agent registered successfully.");
      await loadAgents();
    } catch (caughtError) {
      setError(caughtError.message);
      showError(caughtError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "fullName",
      label: "Name",
      render: (agent) => (
        <div>
          <p className="font-extrabold text-brand-forest">{agent.fullName}</p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">{agent.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
    },
    {
      key: "isActive",
      label: "Status",
      render: (agent) => (agent.isActive ? "Active" : "Inactive"),
    },
  ];

  return (
    <>
      <AdminPageHeader title="Agents" subtitle="Register admins or agents who can help manage properties and website records." />
      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <AdminCard>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <AdminInput label="Full name" name="fullName" onChange={handleChange} required value={formData.fullName} />
            <AdminInput label="Email address" name="email" onChange={handleChange} required type="email" value={formData.email} />
            <AdminInput label="Password" name="password" onChange={handleChange} required type="password" value={formData.password} />
            <AdminInput label="Role" name="role" onChange={handleChange} value={formData.role} />
            {message ? <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">{message}</div> : null}
            {error ? <AdminErrorState message={error} /> : null}
            <AdminButton disabled={isSubmitting} type="submit">
              {isSubmitting ? "Registering..." : "Register Agent"}
            </AdminButton>
          </form>
        </AdminCard>

        <AdminCard>
          {isLoading ? <AdminLoader label="Loading agents" /> : <AdminTable columns={columns} rows={agents} />}
        </AdminCard>
      </div>
    </>
  );
}

export default AdminAgents;
