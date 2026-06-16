import AdminBadge from "../ui/AdminBadge.jsx";
import AdminButton from "../ui/AdminButton.jsx";
import AdminTable from "../ui/AdminTable.jsx";

function BlogPostsTable({ posts }) {
  const columns = [
    {
      key: "title",
      label: "Post",
      render: (post) => (
        <div className="max-w-sm">
          <p className="font-extrabold text-brand-forest">{post.title}</p>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-brand-muted">{post.excerpt}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (post) => post.category || <span className="text-brand-muted/50">—</span>,
    },
    {
      key: "isPublished",
      label: "Status",
      render: (post) => (
        <AdminBadge tone={post.isPublished ? "active" : "hidden"}>
          {post.isPublished ? "Published" : "Draft"}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (post) => (
        <AdminButton size="sm" to={`/admin/blog/${post.id}/edit`} variant="outline">
          Edit
        </AdminButton>
      ),
    },
  ];

  return <AdminTable columns={columns} rows={posts} />;
}

export default BlogPostsTable;
