# Sureboy Realty Task-Based Agent Files

These files are split by actual task/module name instead of numbered parts, so you only open the file needed for the current work.

## Docker Deployment

The project now includes a Docker stack for the public website, admin, Rust API, PostgreSQL, uploads, ffmpeg video compression, and scheduled database backups.

Quick start:

```powershell
Copy-Item .env.docker.example .env
# Edit .env and replace POSTGRES_PASSWORD and JWT_SECRET before running.
docker compose up --build -d
docker compose ps
```

The frontend is served on `http://localhost` by default. The frontend container proxies `/api` and `/uploads` to the Rust API container, so the browser uses one origin.

Optional HTTPS overlay:

```powershell
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

Production notes:

- Set `PUBLIC_ORIGIN=https://your-domain.com`.
- Set `REFRESH_COOKIE_SECURE=true` when HTTPS is active.
- Set `APP_DOMAIN=your-domain.com` and `ACME_EMAIL=admin@your-domain.com` when using `docker-compose.https.yml`.
- Set `HTTP_PORT=127.0.0.1:8080` with the HTTPS overlay if you want the frontend container reachable only from the host while Caddy owns public ports 80/443.
- Use a long random `JWT_SECRET`.
- Keep `postgres_data`, `uploads_data`, and `postgres_backups` volumes backed up.
- The API Docker image includes `ffmpeg`, so video compression works inside Docker.

## Admin Agent Tasks

1. `admin-foundation-brand-rules.md`
2. `admin-stack-folder-structure-routes-auth-guard.md`
3. `admin-layout-sidebar-topbar-dashboard.md`
4. `admin-properties-services-testimonials-messages.md`
5. `admin-newsletter-settings-api-data-flow.md`
6. `admin-forms-tables-image-upload-accessibility.md`
7. `admin-performance-security-implementation-rules.md`
8. `admin-final-expected-result.md`

## Rust API Agent Tasks

1. `api-foundation-stack-design-folder-structure.md`
2. `api-dependencies-env-database-admin-users-properties.md`
3. `api-services-testimonials-messages-newsletter-settings-tables.md`
4. `api-public-auth-property-service-testimonial-endpoints.md`
5. `api-message-newsletter-settings-response-validation.md`
6. `api-security-cors-image-upload-pagination-errors.md`
7. `api-logging-migrations-implementation-architecture-naming.md`
8. `api-frontend-admin-integration-final-rules.md`
