use actix_web::{Responder, web};
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::blog_post_dto::BlogPostRequest,
    handlers::common,
    models::blog_post::BlogPost,
    utils::{
        media_cleanup::cleanup_unused_uploads,
        pagination::{PaginationQuery, make_pagination_meta},
    },
};

const BLOG_COLUMNS: &str = r#"
    id,
    title,
    slug,
    excerpt,
    content,
    cover_image,
    category,
    author,
    is_published,
    published_at,
    created_at,
    updated_at
"#;

fn blog_select() -> String {
    format!("SELECT {BLOG_COLUMNS} FROM blog_posts")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid blog post id"))
}

async fn fetch_post_by_id(pool: &DbPool, id: Uuid) -> Result<Option<BlogPost>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", blog_select());
    sqlx::query_as::<_, BlogPost>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

fn blog_media_refs(post: &BlogPost) -> Vec<String> {
    post.cover_image.clone().into_iter().collect()
}

pub async fn list_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_published = TRUE ORDER BY published_at DESC NULLS LAST, created_at DESC",
        blog_select()
    );

    match sqlx::query_as::<_, BlogPost>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(posts) => common::ok("Blog posts fetched successfully", posts),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_by_slug_public(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let slug = path.into_inner();
    let query = format!(
        "{} WHERE slug = $1 AND is_published = TRUE LIMIT 1",
        blog_select()
    );

    match sqlx::query_as::<_, BlogPost>(&query)
        .bind(slug)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(post)) => common::ok("Blog post fetched successfully", post),
        Ok(None) => common::not_found("Blog post not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn list_admin(
    pool: web::Data<DbPool>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let params = query.into_inner();
    let search = params.search_pattern();

    let count_query = r#"
        SELECT COUNT(*)
        FROM blog_posts
        WHERE ($1::TEXT IS NULL OR title ILIKE $1 OR excerpt ILIKE $1 OR category ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_published = $2)
    "#;

    let total = match sqlx::query_scalar::<_, i64>(count_query)
        .bind(search.clone())
        .bind(params.is_visible)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };

    let list_query = format!(
        r#"
        {}
        WHERE ($1::TEXT IS NULL OR title ILIKE $1 OR excerpt ILIKE $1 OR category ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_published = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#,
        blog_select()
    );

    match sqlx::query_as::<_, BlogPost>(&list_query)
        .bind(search)
        .bind(params.is_visible)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(posts) => common::list(
            "Admin blog posts fetched successfully",
            posts,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_admin_by_id(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match fetch_post_by_id(pool.get_ref(), id).await {
        Ok(Some(post)) => common::ok("Blog post fetched successfully", post),
        Ok(None) => common::not_found("Blog post not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<BlogPostRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    let is_published = request.is_published.unwrap_or(false);
    let published_at = if is_published { Some(Utc::now()) } else { None };

    let query = format!(
        r#"
        INSERT INTO blog_posts (
            id, title, slug, excerpt, content, cover_image,
            category, author, is_published, published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING {BLOG_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, BlogPost>(&query)
        .bind(id)
        .bind(request.title)
        .bind(request.slug)
        .bind(request.excerpt)
        .bind(request.content)
        .bind(request.cover_image)
        .bind(request.category)
        .bind(request.author.unwrap_or_else(|| "Sureboy Realty".to_string()))
        .bind(is_published)
        .bind(published_at)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(post) => common::created("Blog post created successfully", post),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<BlogPostRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    let old_post = match fetch_post_by_id(pool.get_ref(), id).await {
        Ok(Some(post)) => post,
        Ok(None) => return common::not_found("Blog post not found"),
        Err(error) => return common::server_error(error),
    };

    let request = payload.into_inner();
    let is_published = request.is_published.unwrap_or(old_post.is_published);
    let published_at = if is_published && old_post.published_at.is_none() {
        Some(Utc::now())
    } else if !is_published {
        None
    } else {
        old_post.published_at
    };

    let query = format!(
        r#"
        UPDATE blog_posts
        SET title        = $2,
            slug         = $3,
            excerpt      = $4,
            content      = $5,
            cover_image  = $6,
            category     = $7,
            author       = $8,
            is_published = $9,
            published_at = $10,
            updated_at   = now()
        WHERE id = $1
        RETURNING {BLOG_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, BlogPost>(&query)
        .bind(id)
        .bind(request.title)
        .bind(request.slug)
        .bind(request.excerpt)
        .bind(request.content)
        .bind(request.cover_image)
        .bind(request.category)
        .bind(request.author.unwrap_or_else(|| "Sureboy Realty".to_string()))
        .bind(is_published)
        .bind(published_at)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(post)) => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                blog_media_refs(&old_post),
                blog_media_refs(&post),
            )
            .await;
            common::ok("Blog post updated successfully", post)
        }
        Ok(None) => common::not_found("Blog post not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn delete_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    let old_post = match fetch_post_by_id(pool.get_ref(), id).await {
        Ok(Some(post)) => post,
        Ok(None) => return common::not_found("Blog post not found"),
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("DELETE FROM blog_posts WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                blog_media_refs(&old_post),
                Vec::new(),
            )
            .await;
            common::ok("Blog post deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Blog post not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn toggle_published_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    let query = format!(
        r#"
        UPDATE blog_posts
        SET is_published = NOT is_published,
            published_at = CASE
                WHEN NOT is_published THEN now()
                ELSE NULL
            END,
            updated_at = now()
        WHERE id = $1
        RETURNING {BLOG_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, BlogPost>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(post)) => common::ok("Blog post publish status toggled", post),
        Ok(None) => common::not_found("Blog post not found"),
        Err(error) => common::server_error(error),
    }
}
