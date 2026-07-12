import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { adminTeamApi } from "../../api/adminTeamApi.js";
import TeamMemberForm from "../../components/forms/TeamMemberForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function EditTeamMember() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await adminTeamApi.getById(id);
        if (active) {
          setMember(response?.data || null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setMember(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <AdminPageHeader title="Edit Team Member" subtitle={member ? member.fullName : "This person was not found."} />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading team member" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && member ? <TeamMemberForm initialMember={member} mode="edit" /> : null}
      </AdminCard>
    </>
  );
}

export default EditTeamMember;
