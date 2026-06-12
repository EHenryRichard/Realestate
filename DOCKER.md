# Sureboy Realty Docker Runbook

## Local Docker Test

```powershell
Copy-Item .env.docker.example .env
notepad .env
docker compose up --build -d
docker compose ps
```

Open:

- Website/admin: `http://localhost`
- API health through proxy: `http://localhost/api/health`

Create the first admin from your private admin path:

```txt
http://localhost/<ADMIN_BASE_PATH>/signup
```

## Production Values

Before deploying, set these in the root `.env` file:

```env
POSTGRES_PASSWORD=use_a_strong_database_password
JWT_SECRET=use_a_long_random_secret_at_least_64_chars
PUBLIC_ORIGIN=https://your-domain.com
REFRESH_COOKIE_SECURE=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=60
ADMIN_BASE_PATH=/control-use-a-long-random-private-path
ADMIN_API_PATH=/core-use-a-long-random-private-path
```

Keep `REFRESH_COOKIE_SECURE=false` only when testing over plain HTTP.

## HTTPS With Caddy

Set these additional values in `.env`:

```env
APP_DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com
HTTP_PORT=127.0.0.1:8080
PUBLIC_ORIGIN=https://your-domain.com
REFRESH_COOKIE_SECURE=true
```

Then run:

```powershell
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

Caddy handles certificates on ports `80` and `443`, then proxies to the existing frontend container. The frontend container still proxies `/api` and `/uploads` to the API internally.

## Containers

- `frontend`: Nginx serving the React build and proxying `/api` plus `/uploads`.
- `api`: Rust Actix API with ffmpeg installed for video compression.
- `postgres`: PostgreSQL database with a persistent volume.
- `postgres-backup`: scheduled PostgreSQL backups into a persistent backup volume.
- `caddy`: optional HTTPS edge proxy from `docker-compose.https.yml`.

## Persistent Data

These Docker volumes must be preserved:

- `sureboy_postgres_data`
- `sureboy_uploads_data`
- `sureboy_postgres_backups`

## Common Commands

```powershell
docker compose logs -f
docker compose logs -f api
docker compose restart api
docker compose down
docker compose up --build -d
```

To inspect backups:

```powershell
docker compose exec postgres-backup ls -la /backups
```
