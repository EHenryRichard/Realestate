import { useEffect, useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { aboutContent as fallbackContent } from "../../../content/aboutContent.js";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import { adminAboutApi } from "../../api/adminAboutApi.js";
import AboutForm from "../../components/forms/AboutForm.jsx";
import AdminButton from "../../components/ui/AdminButton.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

// The saved copy overrides the bundled defaults section by section, so an empty
// (never-saved) row still gives the editor sensible starting values.
const mergeContent = (saved) => {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return fallbackContent;
  }
  return { ...fallbackContent, ...saved };
};

function AdminAbout() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setContent(fallbackContent);
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await adminAboutApi.get();
        const saved = res?.data?.content ?? null;
        if (active) {
          setContent(mergeContent(saved));
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
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
  }, []);

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton href="/about" icon={BoxArrowUpRight} rel="noreferrer" target="_blank" variant="outline">
            Preview page
          </AdminButton>
        }
        title="About Page"
        subtitle="Edit the story, mission, values, and founder shown on the public About page."
      />
      {isLoading ? <AdminLoader label="Loading About page" /> : null}
      {!isLoading && error ? <AdminErrorState message={error} /> : null}
      {!isLoading && !error && content ? <AboutForm content={content} /> : null}
    </>
  );
}

export default AdminAbout;
