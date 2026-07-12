use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::team_member_dto::TeamMemberRequest,
    handlers::common,
    models::team_member::TeamMember,
    utils::{
        media_cleanup::cleanup_unused_uploads,
        pagination::{PaginationQuery, make_pagination_meta},
        slug::slugify,
    },
};

const TEAM_COLUMNS: &str = r#"
    id,
    full_name,
    title,
    bio,
    photo,
    phone,
    whatsapp,
    email,
    slug,
    sort_order,
    is_visible,
    created_at,
    updated_at
"#;

fn team_select() -> String {
    format!("SELECT {TEAM_COLUMNS} FROM team_members")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid team member id"))
}

fn team_media_refs(member: &TeamMember) -> Vec<String> {
    member.photo.clone().into_iter().collect()
}

async fn fetch_by_id(pool: &DbPool, id: Uuid) -> Result<Option<TeamMember>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", team_select());
    sqlx::query_as::<_, TeamMember>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

// A slug unique across all team members, ignoring the row being edited.
async fn unique_slug(pool: &DbPool, base: &str, current_id: Option<Uuid>) -> Result<String, sqlx::Error> {
    let base = if base.trim().is_empty() {
        "team-member".to_string()
    } else {
        base.to_string()
    };

    let taken: Vec<String> = sqlx::query_scalar(
        "SELECT slug FROM team_members WHERE (slug = $1 OR slug LIKE $2) AND ($3::UUID IS NULL OR id <> $3)",
    )
    .bind(&base)
    .bind(format!("{base}-%"))
    .bind(current_id)
    .fetch_all(pool)
    .await?;

    if !taken.iter().any(|slug| slug == &base) {
        return Ok(base);
    }

    let mut n = 2;
    loop {
        let candidate = format!("{base}-{n}");
        if !taken.iter().any(|slug| slug == &candidate) {
            return Ok(candidate);
        }
        n += 1;
    }
}

fn slug_base(request: &TeamMemberRequest) -> String {
    let requested = request.slug.as_deref().unwrap_or("").trim();
    if requested.is_empty() {
        slugify(&request.full_name)
    } else {
        slugify(requested)
    }
}

pub async fn list_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE ORDER BY sort_order ASC, full_name ASC",
        team_select()
    );

    match sqlx::query_as::<_, TeamMember>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(members) => common::ok("Team fetched successfully", members),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_public_by_slug(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let slug = path.into_inner();
    let query = format!("{} WHERE slug = $1 AND is_visible = TRUE LIMIT 1", team_select());

    match sqlx::query_as::<_, TeamMember>(&query)
        .bind(&slug)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(member)) => common::ok("Team member fetched successfully", member),
        Ok(None) => common::not_found("Team member not found"),
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
        FROM team_members
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR title ILIKE $1 OR bio ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_visible = $2)
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
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR title ILIKE $1 OR bio ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_visible = $2)
        ORDER BY sort_order ASC, full_name ASC
        LIMIT $3 OFFSET $4
        "#,
        team_select()
    );

    match sqlx::query_as::<_, TeamMember>(&list_query)
        .bind(search)
        .bind(params.is_visible)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(members) => common::list(
            "Admin team fetched successfully",
            members,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_admin_by_id(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match fetch_by_id(pool.get_ref(), id).await {
        Ok(Some(member)) => common::ok("Admin team member fetched successfully", member),
        Ok(None) => common::not_found("Team member not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<TeamMemberRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let slug = match unique_slug(pool.get_ref(), &slug_base(&request), None).await {
        Ok(slug) => slug,
        Err(error) => return common::server_error(error),
    };
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO team_members (
          id, full_name, title, bio, photo, phone, whatsapp, email, slug, sort_order, is_visible
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING {TEAM_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, TeamMember>(&query)
        .bind(id)
        .bind(request.full_name)
        .bind(request.title)
        .bind(request.bio)
        .bind(request.photo)
        .bind(request.phone)
        .bind(request.whatsapp)
        .bind(request.email)
        .bind(slug)
        .bind(request.sort_order.unwrap_or(0))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(member) => common::created("Team member created successfully", member),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<TeamMemberRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let old_member = match fetch_by_id(pool.get_ref(), id).await {
        Ok(Some(member)) => member,
        Ok(None) => return common::not_found("Team member not found"),
        Err(error) => return common::server_error(error),
    };
    let request = payload.into_inner();
    let slug = match unique_slug(pool.get_ref(), &slug_base(&request), Some(id)).await {
        Ok(slug) => slug,
        Err(error) => return common::server_error(error),
    };
    let query = format!(
        r#"
        UPDATE team_members
        SET full_name = $2,
            title = $3,
            bio = $4,
            photo = $5,
            phone = $6,
            whatsapp = $7,
            email = $8,
            slug = $9,
            sort_order = $10,
            is_visible = $11,
            updated_at = now()
        WHERE id = $1
        RETURNING {TEAM_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, TeamMember>(&query)
        .bind(id)
        .bind(request.full_name)
        .bind(request.title)
        .bind(request.bio)
        .bind(request.photo)
        .bind(request.phone)
        .bind(request.whatsapp)
        .bind(request.email)
        .bind(slug)
        .bind(request.sort_order.unwrap_or(old_member.sort_order))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(member)) => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                team_media_refs(&old_member),
                team_media_refs(&member),
            )
            .await;
            common::ok("Team member updated successfully", member)
        }
        Ok(None) => common::not_found("Team member not found"),
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
    let old_member = match fetch_by_id(pool.get_ref(), id).await {
        Ok(Some(member)) => member,
        Ok(None) => return common::not_found("Team member not found"),
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("DELETE FROM team_members WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                team_media_refs(&old_member),
                Vec::new(),
            )
            .await;
            common::ok("Team member deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Team member not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn toggle_visible_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE team_members
        SET is_visible = NOT is_visible,
            updated_at = now()
        WHERE id = $1
        RETURNING {TEAM_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, TeamMember>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(member)) => common::ok("Team member visibility updated", member),
        Ok(None) => common::not_found("Team member not found"),
        Err(error) => common::server_error(error),
    }
}
