# Sureboy Realty API

Rust Actix Web + normal parameterized PostgreSQL SQL API scaffold for the Sureboy Realty public website and admin dashboard.

## Scripts

```powershell
cargo run
cargo check
```

The API defaults to `http://127.0.0.1:8080/api`.

## Docker

The root `docker-compose.yml` builds this API into a Debian runtime image with `ffmpeg` installed. In Docker, the API listens on `0.0.0.0:8080`, uses the `postgres` service through `DATABASE_URL`, stores uploads in the `uploads_data` volume at `/app/uploads`, and runs embedded SQLx migrations on startup.

## First Endpoints

- `GET /api/health`
- `GET /api/properties`
- `GET /api/properties/featured`
- `GET /api/services`
- `GET /api/testimonials`
- `POST /api/contact`
- `POST /api/newsletter`
- `POST /api/admin/auth/signup`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/refresh`
- `GET /api/admin/auth/me`
- `GET /api/admin/auth/agents`
- `POST /api/admin/auth/agents`
- `GET /api/admin/dashboard`
- `POST /api/admin/uploads/images`
- `POST /api/admin/uploads/videos`
- `DELETE /api/admin/uploads`

Database migrations are in `migrations/` and follow the tables described in the task files.

The code uses a shared `PgPool` in `web::Data`. Handlers use direct parameterized PostgreSQL SQL through `sqlx::query` and `sqlx::query_as`; do not use SeaORM or another ORM.

Admin accounts use Argon2 password hashes, JSON access tokens, and HttpOnly refresh-token cookies. Login/signup responses return `accessToken` and a minimal `admin`, while the refresh token is set as the `sureboy_refresh_token` cookie. `POST /api/admin/auth/refresh` reads that cookie, verifies it, rotates the refresh cookie, and returns a new `accessToken`.

Admin access is role-aware. `admin` can use every admin endpoint; `agent` can manage properties, upload/delete unused media, read/update messages, and read dashboard/session data. Agent-management, settings, services, testimonials, and newsletter administration stay admin-only.

Responses should expose only the fields needed by the frontend/admin screen. Auth/session/agent admin payloads return `id`, `fullName`, `email`, `role`, and `isActive`; timestamps and password hashes are kept out of those responses.

The first admin signs up through `/api/admin/auth/signup`; after that, admins register agents from the dashboard. Uploaded media is written to `UPLOAD_DIR` and served from `/uploads`.

The API creates `UPLOAD_DIR` automatically on startup if it does not already exist.

Image uploads are optimized by the API. The original file is saved under `uploads/originals/images` with its real uploaded extension, while public `thumbnail`, `medium`, and `large` variants are converted to WebP under `uploads/images`. The top-level `url`/`path` in the response points to the large optimized WebP image so existing admin upload fields can keep using it.

Video uploads use `ffmpeg` through `FFMPEG_PATH`. The API saves the source under `uploads/originals/videos`, creates a compressed browser-safe MP4 under `uploads/videos`, and creates a poster WebP under `uploads/posters`. Install ffmpeg on the server or set `FFMPEG_PATH` to the binary path before using `POST /api/admin/uploads/videos`.

When saved records are updated or deleted, old property/service/testimonial/settings media is removed from disk only after the database no longer references that upload group. `DELETE /api/admin/uploads` can also clean loose unused uploads by receiving `{ "path": "/uploads/images/..." }` or `{ "paths": [...] }`.

Admin list endpoints return pagination metadata and support `page`, `limit`, `search`, and relevant filters such as `status`, `role`, `propertyType`, `isActive`, and `isVisible`.

Public contact/newsletter posts and admin auth posts are rate-limited with `RATE_LIMIT_WINDOW_SECONDS` and `RATE_LIMIT_MAX_REQUESTS`.
