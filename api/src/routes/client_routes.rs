use actix_web::web;

use crate::handlers::{client_activity_handler, client_auth_handler};

/// Public client routes, all under `/api/client/…`. A single `/client` scope
/// holds both the auth sub-scope and the activity endpoints, which avoids any
/// prefix ambiguity between `/client/auth/*` and `/client/*`.
///
/// None of these sit behind the admin guard — the auth endpoints are open, and
/// the account-scoped ones check the client token inside each handler.
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/client")
            // ── Account / auth ──
            .service(
                web::scope("/auth")
                    .route("/register", web::post().to(client_auth_handler::register))
                    .route("/login", web::post().to(client_auth_handler::login))
                    .route("/refresh", web::post().to(client_auth_handler::refresh))
                    .route("/logout", web::post().to(client_auth_handler::logout))
                    .route("/verify-email", web::post().to(client_auth_handler::verify_email))
                    .route(
                        "/resend-verification",
                        web::post().to(client_auth_handler::resend_verification),
                    )
                    .route("/me", web::get().to(client_auth_handler::me))
                    .route("/me", web::patch().to(client_auth_handler::update_me)),
            )
            // ── Saved properties ──
            .route("/saved", web::get().to(client_activity_handler::list_saved))
            .route("/saved/{property_id}", web::post().to(client_activity_handler::save_property))
            .route(
                "/saved/{property_id}",
                web::delete().to(client_activity_handler::unsave_property),
            )
            // ── Recently viewed ──
            .route("/views", web::get().to(client_activity_handler::list_viewed))
            .route("/views/{property_id}", web::post().to(client_activity_handler::record_view))
            // ── Inquiries (contact an agent) ──
            .route("/inquiries", web::get().to(client_activity_handler::list_inquiries))
            .route("/inquiries", web::post().to(client_activity_handler::create_inquiry))
            // ── Web push subscriptions ──
            .route(
                "/notifications/subscribe",
                web::post().to(client_activity_handler::subscribe_push),
            )
            .route(
                "/notifications/subscribe",
                web::delete().to(client_activity_handler::unsubscribe_push),
            ),
    );
}
