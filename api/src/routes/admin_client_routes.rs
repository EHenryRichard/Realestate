use actix_web::web;

use crate::handlers::admin_client_handler;

/// Admin management of public/client accounts, mounted under the admin scope at
/// `/api/<admin_api_path>/users`. The admin auth middleware guards the whole
/// scope, and `/users` isn't in the agent allow-list, so this is admin-only.
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .route("", web::get().to(admin_client_handler::list_clients))
            .route("/{id}", web::get().to(admin_client_handler::get_client))
            .route("/{id}", web::patch().to(admin_client_handler::update_client))
            .route("/{id}", web::delete().to(admin_client_handler::delete_client))
            .route(
                "/{id}/toggle",
                web::patch().to(admin_client_handler::toggle_client_active),
            ),
    );
}
