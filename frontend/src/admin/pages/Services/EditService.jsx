import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { servicesData } from "../../../data/servicesData.js";
import { adminServiceApi } from "../../api/adminServiceApi.js";
import ServiceForm from "../../components/forms/ServiceForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function EditService() {
  const { id } = useParams();
  const [service, setService] = useState(() => servicesData.find((item) => item.id === id || item.slug === id));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setService(servicesData.find((item) => item.id === id || item.slug === id));
      return undefined;
    }

    let active = true;

    const loadService = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminServiceApi.getById(id);

        if (active) {
          setService(response?.data || null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setService(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadService();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <AdminPageHeader title="Edit Help We Offer" subtitle={service ? service.title : "This service was not found."} />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading service" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && service ? <ServiceForm initialService={service} mode="edit" /> : null}
      </AdminCard>
    </>
  );
}

export default EditService;
