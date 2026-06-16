import { useEffect, useState } from "react";
import { blogApi } from "../api/blogApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { blogData } from "../data/blogData.js";

const normalizePost = (post) => ({
  ...post,
  isPublished: post.isPublished ?? post.is_published ?? false,
  publishedAt: post.publishedAt ?? post.published_at ?? null,
  coverImage: post.coverImage ?? post.cover_image ?? "",
});

export const useBlogPost = (slug) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      setLoading(true);
      setError("");

      try {
        if (apiConfig.useApi) {
          const response = await blogApi.getBySlug(slug);
          if (active) setPost(normalizePost(response?.data || response));
        } else {
          const found = blogData.find((p) => p.slug === slug);
          if (active) setPost(found ? normalizePost(found) : null);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setPost(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPost();
    return () => { active = false; };
  }, [slug]);

  return { post, loading, error };
};
