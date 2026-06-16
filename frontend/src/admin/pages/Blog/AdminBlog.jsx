import { PlusLg } from "react-bootstrap-icons";
import BlogPostsTable from "../../components/tables/BlogPostsTable.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminErrorState from "../../components/ui/AdminErrorState.jsx";
import AdminLoader from "../../components/ui/AdminLoader.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";
import { useAdminBlogPosts } from "../../hooks/useAdminBlogPosts.js";

function AdminBlog() {
  const { error, isLoading, posts } = useAdminBlogPosts();

  return (
    <>
      <AdminPageHeader
        action={{ icon: PlusLg, label: "New Post", to: "/admin/blog/create" }}
        subtitle="Write and publish articles, land tips, and investment guides for the public blog."
        title="Blog"
      />
      <AdminCard>
        {isLoading ? <AdminLoader label="Loading posts" /> : null}
        {error ? <AdminErrorState message={error} /> : null}
        {!isLoading && !error ? <BlogPostsTable posts={posts} /> : null}
      </AdminCard>
    </>
  );
}

export default AdminBlog;
