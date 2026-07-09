import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig.js";
import { blogData } from "../../../data/blogData.js";
import { adminBlogApi } from "../../api/adminBlogApi.js";
import BlogPostForm from "../../components/forms/BlogPostForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function EditBlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(() => blogData.find((p) => p.id === id));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiConfig.useApi);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setPost(blogData.find((p) => p.id === id));
      return undefined;
    }

    let active = true;

    const loadPost = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminBlogApi.getById(id);
        if (active) setPost(response?.data || null);
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setPost(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadPost();
    return () => { active = false; };
  }, [id]);

  return (
    <>
      <AdminPageHeader
        subtitle={post ? post.title : "Post not found."}
        title="Edit Post"
      />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading post" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error && post ? <BlogPostForm initialPost={post} mode="edit" /> : null}
      </AdminCard>
    </>
  );
}

export default EditBlogPost;
