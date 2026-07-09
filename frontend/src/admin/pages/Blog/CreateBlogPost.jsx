import BlogPostForm from "../../components/forms/BlogPostForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateBlogPost() {
  return (
    <>
      <AdminPageHeader
        subtitle="Write a helpful post. You can save it first and publish it later."
        title="New Post"
      />
      <AdminCard>
        <BlogPostForm />
      </AdminCard>
    </>
  );
}

export default CreateBlogPost;
