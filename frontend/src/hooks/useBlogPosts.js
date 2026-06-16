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

export const useBlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = apiConfig.useApi ? await blogApi.getAll() : blogData;
        const nextPosts = (Array.isArray(response) ? response : response?.data || []).map(normalizePost);

        if (active) setPosts(nextPosts);
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setPosts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPosts();
    return () => { active = false; };
  }, []);

  return { posts, loading, error, empty: !loading && !error && posts.length === 0 };
};
