import { useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminBlogApi } from "../../api/adminBlogApi.js";
import BlogEditor from "../editor/BlogEditor.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminImageUploader from "../ui/AdminImageUploader.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function BlogPostForm({ initialPost, mode = "create" }) {
  const [formData, setFormData] = useState({
    title: initialPost?.title || "",
    slug: initialPost?.slug || "",
    excerpt: initialPost?.excerpt || "",
    content: initialPost?.content || "",
    coverImage: initialPost?.coverImage || "",
    category: initialPost?.category || "",
    author: initialPost?.author || "Sureboy Realty",
    isPublished: initialPost?.isPublished ?? false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "title" && mode === "create") {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      coverImage: formData.coverImage || null,
      category: formData.category || null,
      author: formData.author || "Sureboy Realty",
      isPublished: formData.isPublished,
    };

    if (!apiConfig.useApi) {
      showToast("Blog post payload ready for the API.");
      setMessage("Blog post payload ready for the API.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "edit") {
        await adminBlogApi.update(initialPost.id, payload);
      } else {
        await adminBlogApi.create(payload);
      }

      const label = mode === "edit" ? "Post updated successfully." : "Post created successfully.";
      setMessage(label);
      showSuccess(label);
    } catch (caughtError) {
      setError(caughtError.message);
      showError(caughtError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <AdminInput
          label="Title"
          name="title"
          onChange={handleChange}
          required
          value={formData.title}
        />
        <AdminInput
          label="Slug (auto-generated)"
          name="slug"
          onChange={handleChange}
          required
          value={formData.slug}
        />
        <AdminInput
          label="Category"
          name="category"
          onChange={handleChange}
          placeholder="e.g. Land Verification, Investment, Buyer Tips"
          value={formData.category}
        />
        <AdminInput
          label="Author"
          name="author"
          onChange={handleChange}
          value={formData.author}
        />
      </div>

      <AdminImageUploader
        label="Cover image"
        name="coverImage"
        onChange={handleChange}
        value={formData.coverImage}
      />

      <AdminTextarea
        label="Excerpt (short summary shown on the blog listing page)"
        name="excerpt"
        onChange={handleChange}
        required
        rows={3}
        value={formData.excerpt}
      />

      <BlogEditor
        label="Content"
        onChange={handleChange}
        required
        value={formData.content}
      />

      <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
        <input
          checked={formData.isPublished}
          className="h-4 w-4 accent-brand-forest"
          name="isPublished"
          onChange={handleChange}
          type="checkbox"
        />
        Publish immediately (visible on the public blog)
      </label>

      {message ? (
        <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : mode === "edit" ? "Update Post" : "Create Post"}
        </AdminButton>
        <AdminButton to="/admin/blog" variant="outline">
          Back to Blog
        </AdminButton>
      </div>
    </form>
  );
}

export default BlogPostForm;
