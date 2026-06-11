import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { propertiesData } from "../../../data/propertiesData.js";
import { adminPropertyApi } from "../../api/adminPropertyApi.js";
import PropertyForm from "../../components/forms/PropertyForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function EditProperty() {
  const { id } = useParams();
  const [property, setProperty] = useState(() => propertiesData.find((item) => item.id === id || item.slug === id));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setProperty(propertiesData.find((item) => item.id === id || item.slug === id));
      return undefined;
    }

    let active = true;

    const loadProperty = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminPropertyApi.getById(id);

        if (active) {
          setProperty(response?.data || null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setProperty(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadProperty();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <AdminPageHeader title="Edit Property" subtitle={property ? property.title : "This local fallback record was not found."} />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading property" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && property ? <PropertyForm initialProperty={property} mode="edit" /> : null}
      </AdminCard>
    </>
  );
}

export default EditProperty;
