import MessagesTable from "../../components/tables/MessagesTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import AdminSearchInput from "../../components/ui/AdminSearchInput.jsx";
import { useAdminMessages } from "../../hooks/useAdminMessages.js";

function AdminMessages() {
  const { error, isLoading, messages, search, setSearch } = useAdminMessages();

  return (
    <>
      <AdminPageHeader title="Messages" subtitle="Read messages from people who contacted Sureboy Realty." />
      <AdminCard>
        <AdminSearchInput className="mb-4" label="Search messages" onChange={(event) => setSearch(event.target.value)} value={search} />
        {isLoading ? <AdminLoader label="Loading messages" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <MessagesTable messages={messages} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminMessages;
