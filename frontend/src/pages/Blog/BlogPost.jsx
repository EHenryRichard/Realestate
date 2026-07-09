import { ArrowLeft, Calendar, Person } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom";
import MarkdownRenderer from "../../components/ui/MarkdownRenderer/MarkdownRenderer.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../components/ui/LoadingState/LoadingState.jsx";
import { useBlogPost } from "../../hooks/useBlogPost.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function BlogPost() {
  const { slug } = useParams();
  const { post, loading, error } = useBlogPost(slug);

  usePageMeta(
    post
      ? {
          title: `${post.title} | Sureboy Realty`,
          description: post.excerpt,
          ogImage: post.coverImage || "/og-image.jpg",
        }
      : { title: "Article | Sureboy Realty", description: "", ogImage: "/og-image.jpg" }
  );

  if (loading) {
    return (
      <div className="py-32">
        <LoadingState label="Loading article" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-32">
        <ErrorState message={error || "This article could not be found."} />
      </div>
    );
  }

  return (
    <article>
      <div className="bg-brand-forest py-16 text-white">
        <Container>
          <Link
            className="mb-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold/80 transition hover:text-brand-gold"
            to="/blog"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to News & Tips
          </Link>

          {post.category ? (
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.1em] text-brand-gold">
              {post.category}
            </p>
          ) : null}

          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-[0] sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <Person aria-hidden="true" className="h-4 w-4" />
              {post.author}
            </span>
            {post.publishedAt ? (
              <span className="flex items-center gap-2">
                <Calendar aria-hidden="true" className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </Container>
      </div>

      {post.coverImage ? (
        <div className="bg-brand-forest/6">
          <Container>
            <img
              alt={post.title}
              className="max-h-96 w-full object-cover"
              src={post.coverImage}
            />
          </Container>
        </div>
      ) : null}

      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-2xl">
            <p className="mb-8 border-l-4 border-brand-gold pl-5 text-lg font-semibold leading-8 text-brand-forest/80 italic">
              {post.excerpt}
            </p>

            <MarkdownRenderer content={post.content} />

            <div className="mt-16 border-t border-brand-forest/10 pt-10">
              <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-brand-muted">
                Want to discuss this?
              </p>
              <p className="mt-2 text-base text-brand-charcoal/80">
                Call or WhatsApp Sureboy Realty directly. We answer every message.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 bg-brand-forest px-5 py-3 text-sm font-extrabold uppercase tracking-[0.06em] text-white transition hover:bg-brand-emerald"
                  to="/contact"
                >
                  Talk to Us
                </Link>
                <Link
                  className="inline-flex items-center gap-2 border border-brand-forest px-5 py-3 text-sm font-extrabold uppercase tracking-[0.06em] text-brand-forest transition hover:bg-brand-forest hover:text-white"
                  to="/blog"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  More Articles
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </article>
  );
}

export default BlogPost;
