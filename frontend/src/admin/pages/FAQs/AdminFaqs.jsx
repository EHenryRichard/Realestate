import { PlusLg } from "react-bootstrap-icons";
import FaqsTable from "../../components/tables/FaqsTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import { useAdminFaqs } from "../../hooks/useAdminFaqs.js";

function AdminFaqs() {
  const { error, isLoading, faqs } = useAdminFaqs();

  return (
    <>
      <AdminPageHeader
        action={{ icon: PlusLg, label: "Add Question", to: "/admin/faqs/create" }}
        subtitle="Add common questions and clear answers for visitors."
        title="Questions"
      />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading questions" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <FaqsTable faqs={faqs} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminFaqs;
