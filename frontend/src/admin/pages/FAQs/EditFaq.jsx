import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { faqsData } from "../../../data/faqsData.js";
import { adminFaqApi } from "../../api/adminFaqApi.js";
import FaqForm from "../../components/forms/FaqForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function EditFaq() {
  const { id } = useParams();
  const [faq, setFaq] = useState(() => faqsData.find((item) => item.id === id));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setFaq(faqsData.find((item) => item.id === id));
      return undefined;
    }

    let active = true;

    const loadFaq = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminFaqApi.getById(id);

        if (active) {
          setFaq(response?.data || null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setFaq(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadFaq();

    return () => {
      active = false;
    };
  }, [id]);

  const subtitle = faq
    ? faq.answer
      ? faq.question
      : `${faq.question} - no answer yet`
    : "Question not found.";

  return (
    <>
      <AdminPageHeader subtitle={subtitle} title="Edit Question" />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading question" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && faq ? <FaqForm initialFaq={faq} mode="edit" /> : null}
      </AdminCard>
    </>
  );
}

export default EditFaq;
