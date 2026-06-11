import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { testimonialsData } from "../../../data/testimonialsData.js";
import { adminTestimonialApi } from "../../api/adminTestimonialApi.js";
import TestimonialForm from "../../components/forms/TestimonialForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function EditTestimonial() {
  const { id } = useParams();
  const [testimonial, setTestimonial] = useState(() => testimonialsData.find((item) => item.id === id));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setTestimonial(testimonialsData.find((item) => item.id === id));
      return undefined;
    }

    let active = true;

    const loadTestimonial = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminTestimonialApi.getById(id);

        if (active) {
          setTestimonial(response?.data || null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setTestimonial(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadTestimonial();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <AdminPageHeader title="Edit Testimonial" subtitle={testimonial ? testimonial.clientName : "This local fallback record was not found."} />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading testimonial" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && testimonial ? <TestimonialForm initialTestimonial={testimonial} mode="edit" /> : null}
      </AdminCard>
    </>
  );
}

export default EditTestimonial;
