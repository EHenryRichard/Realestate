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
        action={{ icon: PlusLg, label: "Add FAQ", to: "/admin/faqs/create" }}
        subtitle="Manage questions and answers. Unanswered FAQs are saved but not shown publicly."
        title="FAQs"
      />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading FAQs" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <FaqsTable faqs={faqs} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminFaqs;
