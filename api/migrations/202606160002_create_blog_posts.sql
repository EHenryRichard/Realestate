CREATE TABLE blog_posts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT        NOT NULL,
    slug         TEXT        UNIQUE NOT NULL,
    excerpt      TEXT        NOT NULL,
    content      TEXT        NOT NULL DEFAULT '',
    cover_image  TEXT,
    category     TEXT,
    author       TEXT        NOT NULL DEFAULT 'Sureboy Realty',
    is_published BOOLEAN     NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_blog_posts_slug         ON blog_posts(slug);
CREATE INDEX        idx_blog_posts_published    ON blog_posts(is_published);
CREATE INDEX        idx_blog_posts_published_at ON blog_posts(published_at DESC NULLS LAST);
CREATE INDEX        idx_blog_posts_category     ON blog_posts(category);
