import TeamMemberForm from "../../components/forms/TeamMemberForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateTeamMember() {
  return (
    <>
      <AdminPageHeader title="Add Team Member" subtitle="Add someone to the public Our Team page — photo, title, and a short bio." />
      <AdminCard>
        <TeamMemberForm />
      </AdminCard>
    </>
  );
}

export default CreateTeamMember;
