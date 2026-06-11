# RUST_API_AGENT.md - Current API Start

The Rust API has been started from the split task files referenced in the root `README.md`.

Current scaffold:

- `Cargo.toml` uses Actix Web, SQLx/PostgreSQL, Serde, Tokio, dotenvy, validator, JWT/Argon2 password hashing, CORS, multipart uploads, static upload serving, tracing, and UUID/chrono.
- `api/Dockerfile` builds a production API image and installs ffmpeg in the runtime layer so video compression works inside Docker.
- `.env.example` contains the development server, database, JWT, frontend, admin, and upload environment variables.
- `src/main.rs` connects to PostgreSQL once, stores a `PgPool` in `web::Data`, and mounts routes under `/api`.
- `src/main.rs` creates `UPLOAD_DIR` on startup before serving `/uploads`, so image upload/static serving does not fail when the folder is missing.
- `src/config.rs`, `src/error.rs`, `src/db.rs`, and lightweight JSON response helpers are present.
- Route modules exist for public routes, admin routes, dashboard, auth, properties, services, testimonials, messages, newsletter, settings, and uploads.
- Handler modules use normal parameterized PostgreSQL SQL through `sqlx::query` and `sqlx::query_as`. Do not use SeaORM or any ORM in this API.
- Admin auth now supports first-admin signup, login with Argon2 password verification, JSON access-token creation, HttpOnly refresh-token cookie creation/rotation, `/auth/refresh`, `/auth/me`, and admin-only agent listing/registration.
- `/api/admin/*` is now wrapped with access-token middleware. Signup, login, refresh, logout, and CORS preflight stay public; all other admin routes require a valid access token with `tokenType = access`.
- Admin-vs-agent permissions are enforced in middleware. Admins retain full access; agents can read dashboard/session data, manage properties, upload/delete unused media, and read/update messages, but cannot register users or change services, testimonials, newsletter, or settings.
- Public contact/newsletter posts and admin auth posts are protected by a simple in-memory rate limiter controlled by `RATE_LIMIT_WINDOW_SECONDS` and `RATE_LIMIT_MAX_REQUESTS`.
- API responses should return only the fields needed by the frontend/admin screen. Do not serialize raw database rows when they contain extra fields; create response DTOs instead. Admin auth/session/agent responses now expose only `id`, `fullName`, `email`, `role`, and `isActive`; timestamps and password hashes stay out of those payloads.
- Admin image uploads use `POST /api/admin/uploads/images` with multipart form data. The API accepts jpg, jpeg, png, and webp uploads, saves the source file with its real extension, converts every public `thumbnail`, `medium`, and `large` variant to optimized WebP, returns the large WebP URL as the top-level `url`, and serves public media from `/uploads/...`.
- Admin video uploads use `POST /api/admin/uploads/videos` with multipart form data. The API saves the source file, uses `FFMPEG_PATH`/`ffmpeg` to create a compressed MP4 and poster WebP, and returns only the public video/poster paths needed by the admin frontend.
- `DELETE /api/admin/uploads` accepts one upload `path` or a `paths` array and removes only unused uploaded media. Property, service, testimonial, and settings update/delete handlers also clean old image/video files after the database no longer references them.
- Property gallery image paths are persisted in `property_gallery_images` and returned from property APIs as `galleryImages`.
- Properties now support optional `videoUrl` and `videoPoster` fields for uploaded/compressed listing videos.
- Admin list handlers now support pagination metadata plus search/filter query params such as `page`, `limit`, `search`, `status`, `role`, `propertyType`, `isActive`, and `isVisible` where they apply.
- `RUST_LEARNING_GUIDE.md` exists as the beginner-friendly guide for learning how this Actix + SQLx API works. Keep explanations aligned with that guide when the user asks to learn Rust by writing the API manually.
- DTO, model, repository, service, middleware, and utility folders are present. Repository/service folders remain ready for a future refactor if the API grows.
- Utility helpers should stay Clippy-clean; prefer standard slice helpers such as `contains` where they are clearer and more efficient than manual iterator checks.
- PostgreSQL migration files exist for admin users, properties, gallery images, services, testimonials, contact messages, newsletter subscribers, and site settings.

Next backend priority:

1. Create the first admin through `POST /api/admin/auth/signup`; auth responses return `accessToken` and a minimal `admin`, while the refresh token is sent only as the HttpOnly `sureboy_refresh_token` cookie.
2. For non-Docker local video testing, install ffmpeg on the host or set `FFMPEG_PATH` to a working ffmpeg binary path. Docker already installs ffmpeg in the API image.
3. Add real integration tests for auth, role permissions, upload cleanup, and admin list pagination.
4. Connect the admin UI to the new delete-upload endpoint when replacing or removing unsaved media previews.
