import BlogPostForm from "../../components/forms/BlogPostForm.jsx";
import AdminCard from "../../components/ui/AdminCard.jsx";
import AdminPageHeader from "../../components/ui/AdminPageHeader.jsx";

function CreateBlogPost() {
  return (
    <>
      <AdminPageHeader
        subtitle="Write your article using markdown formatting. You can save as draft and publish later."
        title="New Blog Post"
      />
      <AdminCard>
        <BlogPostForm />
      </AdminCard>
    </>
  );
}

export default CreateBlogPost;
