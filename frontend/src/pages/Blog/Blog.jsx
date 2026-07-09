import { ArrowRight } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { seoContent } from "../../content/seoContent.js";
import { useBlogPosts } from "../../hooks/useBlogPosts.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import LazyImage from "../../components/ui/LazyImage/LazyImage.jsx";
import LoadingState from "../../components/ui/LoadingState/LoadingState.jsx";

const CATEGORY_COLORS = {
  "Land Verification": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Buyer Tips": "bg-brand-gold/12 text-brand-forest border-brand-gold/30",
  Investment: "bg-blue-50 text-blue-800 border-blue-200",
  "Market Update": "bg-amber-50 text-amber-800 border-amber-200",
};

function CategoryBadge({ category }) {
  if (!category) return null;
  const cls = CATEGORY_COLORS[category] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${cls}`}>
      {category}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function FeaturedPostCard({ post }) {
  return (
    <Link
      className="group grid gap-0 overflow-hidden border border-brand-forest/10 bg-white transition hover:border-brand-forest/25 lg:grid-cols-2"
      to={`/blog/${post.slug}`}
    >
      <div className="relative min-h-64 bg-brand-forest/8 lg:min-h-80">
        <LazyImage
          alt={post.title}
          className="h-full w-full object-cover"
          src={post.coverImage || ""}
        />
        <div className="absolute left-4 top-4">
          <CategoryBadge category={post.category} />
        </div>
      </div>

      <div className="flex flex-col justify-center p-8 lg:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-muted">
          {formatDate(post.publishedAt)} · {post.author}
        </p>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-normal text-brand-charcoal group-hover:text-brand-forest sm:text-3xl">
          {post.title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-brand-muted">{post.excerpt}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.06em] text-brand-forest">
          Read Article
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }) {
  return (
    <Link
      className="group flex flex-col overflow-hidden border border-brand-forest/10 bg-white transition hover:border-brand-forest/25"
      to={`/blog/${post.slug}`}
    >
      <div className="relative h-44 bg-brand-forest/6">
        <LazyImage
          alt={post.title}
          className="h-full w-full object-cover"
          src={post.coverImage || ""}
        />
        <div className="absolute left-3 top-3">
          <CategoryBadge category={post.category} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-muted">
          {formatDate(post.publishedAt)}
        </p>
        <h3 className="mt-2 text-lg font-black leading-snug tracking-normal text-brand-charcoal group-hover:text-brand-forest">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-brand-muted">
          {post.excerpt}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-brand-forest">
          Read More
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function Blog() {
  usePageMeta(seoContent.blog);
  const { posts, loading, error, empty } = useBlogPosts();

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen">
      <section className="border-b border-brand-forest/10 bg-brand-forest py-16 text-white">
        <Container>
          <p className="text-xs font-extrabold uppercase tracking-widest text-brand-gold">
            News & Tips
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
            Simple real estate tips from Warri.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
            Clear advice on land documents, buying safely, and finding the right place in Delta State.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          {loading ? <LoadingState label="Loading articles" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {empty ? (
            <EmptyState message="No articles published yet. Check back soon." />
          ) : null}

          {!loading && !error && !empty ? (
            <div className="grid gap-10">
              {featured ? <FeaturedPostCard post={featured} /> : null}

              {rest.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Container>
      </section>
    </div>
  );
}

export default Blog;
