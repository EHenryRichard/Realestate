// agent_handler.rs
// ─────────────────────────────────────────────────────────────────────────────
// "Become an agent" flow:
//   1. Public submits a request (their email)          → submit_request (public)
//   2. Admin reviews and approves/rejects              → list/approve/reject (admin)
//   3. On approve, the person is emailed a signup link → complete_signup (public)
// The admin endpoints live under the admin scope, so the auth middleware makes
// them admin-only (agents can't approve other agents).
// ─────────────────────────────────────────────────────────────────────────────

use actix_web::{Responder, web};
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::agent_dto::{AgentRequestCreate, AgentSignupComplete},
    handlers::common,
    models::agent_request::AgentRequest,
    services::email_service::Mailer,
    utils::{
        jwt::{create_agent_invite_token, verify_agent_invite_token},
        pagination::{PaginationQuery, make_pagination_meta},
        password::hash_password,
    },
};

const REQUEST_COLUMNS: &str =
    "id, email, full_name, phone, message, status, created_at, updated_at";

fn clean(value: Option<String>) -> Option<String> {
    value
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

// ─── Public ─────────────────────────────────────────────────────────────────

/// POST /agent-requests — someone applies to become an agent. Always replies the
/// same way (doesn't reveal whether the email already applied or has an account).
pub async fn submit_request(
    pool: web::Data<DbPool>,
    payload: web::Json<AgentRequestCreate>,
) -> impl Responder {
    let req = payload.into_inner();
    let email = req.email.trim().to_lowercase();
    if email.is_empty() || !email.contains('@') {
        return common::bad_request("A valid email is required");
    }
    let generic = "Thanks! Your request has been received. We'll email you if it's approved.";

    // Skip if there's already a pending/approved request for this email.
    match sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM agent_requests WHERE email = $1 AND status IN ('pending','approved')",
    )
    .bind(&email)
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(count) if count > 0 => return common::ok(generic, serde_json::json!({})),
        Err(error) => return common::server_error(error),
        _ => {}
    }

    match sqlx::query(
        "INSERT INTO agent_requests (email, full_name, phone, message) VALUES ($1, $2, $3, $4)",
    )
    .bind(&email)
    .bind(clean(req.full_name))
    .bind(clean(req.phone))
    .bind(clean(req.message))
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => common::created(generic, serde_json::json!({})),
        Err(error) => common::server_error(error),
    }
}

/// POST /agent-signup — finish creating the agent account using the emailed
/// invite token. Verifies the token, that the request is still `approved`, and
/// that the email isn't already taken, then creates an active agent.
pub async fn complete_signup(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<AgentSignupComplete>,
) -> impl Responder {
    let req = payload.into_inner();
    if req.full_name.trim().is_empty() || req.password.trim().len() < 6 {
        return common::bad_request("Full name and a 6+ character password are required");
    }

    let claims = match verify_agent_invite_token(req.token.trim(), &config.jwt_secret) {
        Ok(claims) if claims.token_type == "agent_invite" => claims,
        _ => return common::bad_request("This invite link is invalid or has expired"),
    };

    // The request must still be in the `approved` state (single-use: it flips to
    // `completed` below, so the link can't be reused).
    let request = match sqlx::query_as::<_, AgentRequest>(&format!(
        "SELECT {REQUEST_COLUMNS} FROM agent_requests WHERE id = $1 LIMIT 1"
    ))
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(request)) => request,
        Ok(None) => return common::bad_request("This invite link is invalid or has expired"),
        Err(error) => return common::server_error(error),
    };
    if request.status != "approved" {
        return common::bad_request("This invite has already been used or is no longer valid");
    }

    // The email (from the token) must not already have an account.
    match sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM admin_users WHERE email = $1")
        .bind(&claims.email)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(count) if count > 0 => {
            return common::bad_request("An account with this email already exists");
        }
        Err(error) => return common::server_error(error),
        _ => {}
    }

    let password_hash = match hash_password(req.password.trim()) {
        Ok(hash) => hash,
        Err(error) => return common::server_error(error),
    };

    // Create the agent account (active, role agent, not primary).
    let insert = sqlx::query(
        "INSERT INTO admin_users (id, full_name, email, password_hash, role, is_active, phone, title, bio, is_primary) \
         VALUES ($1, $2, $3, $4, 'agent', TRUE, $5, $6, $7, FALSE)",
    )
    .bind(Uuid::new_v4())
    .bind(req.full_name.trim())
    .bind(&claims.email)
    .bind(password_hash)
    .bind(clean(req.phone))
    .bind(clean(req.title))
    .bind(clean(req.bio))
    .execute(pool.get_ref())
    .await;

    if let Err(error) = insert {
        return common::server_error(error);
    }

    // Mark the request completed so the invite can't be reused.
    let _ = sqlx::query("UPDATE agent_requests SET status = 'completed', updated_at = now() WHERE id = $1")
        .bind(request.id)
        .execute(pool.get_ref())
        .await;

    common::created(
        "Your agent account is ready. You can now log in.",
        serde_json::json!({ "email": claims.email }),
    )
}

// ─── Admin ──────────────────────────────────────────────────────────────────

/// GET /agent-requests — list applications (optionally filtered by `?status=`).
pub async fn list_requests(
    pool: web::Data<DbPool>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let params = query.into_inner();
    let status = params
        .status
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty() && *v != "all")
        .map(str::to_string);

    let total = match sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM agent_requests WHERE ($1::TEXT IS NULL OR status = $1)",
    )
    .bind(status.clone())
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };

    let list_query = format!(
        "SELECT {REQUEST_COLUMNS} FROM agent_requests \
         WHERE ($1::TEXT IS NULL OR status = $1) \
         ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    );
    match sqlx::query_as::<_, AgentRequest>(&list_query)
        .bind(status)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(rows) => common::list(
            "Agent requests fetched",
            rows,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

/// PATCH /agent-requests/{id}/approve — approve + email the signup link.
pub async fn approve_request(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    mailer: web::Data<Mailer>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid request id"),
    };

    let request = match sqlx::query_as::<_, AgentRequest>(&format!(
        "UPDATE agent_requests SET status = 'approved', updated_at = now() \
         WHERE id = $1 AND status IN ('pending','approved') RETURNING {REQUEST_COLUMNS}"
    ))
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(request)) => request,
        Ok(None) => return common::not_found("Request not found or already handled"),
        Err(error) => return common::server_error(error),
    };

    // Mint the invite link and email it.
    let token = match create_agent_invite_token(
        request.id,
        &request.email,
        &config.jwt_secret,
        &config.agent_invite_expires_in,
    ) {
        Ok(token) => token,
        Err(error) => return common::server_error(error),
    };
    let signup_url = format!(
        "{}/agent-signup?token={token}",
        config.frontend_url.trim_end_matches('/')
    );
    if let Err(error) = mailer.send_agent_invite(&request.email, &signup_url).await {
        tracing::error!("Failed to send agent invite to {}: {error}", request.email);
    }

    common::ok("Request approved — invite emailed.", request)
}

/// PATCH /agent-requests/{id}/reject — mark an application rejected.
pub async fn reject_request(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid request id"),
    };

    match sqlx::query_as::<_, AgentRequest>(&format!(
        "UPDATE agent_requests SET status = 'rejected', updated_at = now() \
         WHERE id = $1 RETURNING {REQUEST_COLUMNS}"
    ))
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(request)) => common::ok("Request rejected", request),
        Ok(None) => common::not_found("Request not found"),
        Err(error) => common::server_error(error),
    }
}
