import { useEffect, useState } from "react";
import { apiConfig } from "../../config/apiConfig.js";
import { blogData } from "../../data/blogData.js";
import { adminBlogApi } from "../api/adminBlogApi.js";

const normalizePost = (post) => ({
  ...post,
  isPublished: post.isPublished ?? post.is_published ?? false,
  publishedAt: post.publishedAt ?? post.published_at ?? null,
  coverImage: post.coverImage ?? post.cover_image ?? "",
});

export function useAdminBlogPosts() {
  const [posts, setPosts] = useState(() => blogData.map(normalizePost));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiConfig.useApi) {
      setPosts(blogData.map(normalizePost));
      return undefined;
    }

    let active = true;

    const loadPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await adminBlogApi.list();
        const nextPosts = (response?.data || []).map(normalizePost);
        if (active) setPosts(nextPosts);
      } catch (caughtError) {
        if (active) {
          setError(caughtError.message);
          setPosts([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadPosts();
    return () => { active = false; };
  }, []);

  return { error, isLoading, posts };
}
