# Sureboy Realty — Deployment Runbook

End-to-end guide for deploying this project to a Linux VPS (Contabo) with HTTPS,
plus every gotcha we hit and how to fix it. Production domain: `sureboyrealty.com`.

---

## 1. Architecture

Five Docker containers, orchestrated by Docker Compose:

| Container | Role |
| --- | --- |
| `caddy` | HTTPS edge proxy. Gets/renews Let's Encrypt certs automatically (ACME), owns ports 80/443, proxies to `frontend`. From `docker-compose.https.yml`. |
| `frontend` | Nginx serving the React build; proxies `/api` and `/uploads` to `api`. Binds only to `127.0.0.1:8080` (internal) so Caddy can own 80/443. |
| `api` | Rust/Actix API. Has ffmpeg + ffprobe for video compression. Runs DB migrations on startup. |
| `postgres` | PostgreSQL database (persistent volume). |
| `postgres-backup` | Scheduled database dumps to a persistent volume. |

Persistent volumes (NEVER delete these on a live site):
`realestate_postgres_data`, `realestate_uploads_data`, `realestate_postgres_backups`,
`realestate_caddy_data`, `realestate_caddy_config`.

### Features built into this deployment
- **Video compression** (ffmpeg) that runs in the background — uploads return
  immediately, compression continues after. Tunable via `VIDEO_*` env vars,
  with auto hardware-encoder detection and an instant "remux" fast-path.
- **Signed, expiring video URLs** — public property videos are served via
  `/api/stream/videos/...?exp=&sig=` so links can't be shared/hotlinked.
- **nginx Referer hotlink protection** on video paths (defence in depth).
- **Multi-video carousel** + **custom video player** on property pages.
- **Web Push lead alerts** — the super admin can enable browser push
  notifications for new contact enquiries and newsletter signups.

---

## 2. Prerequisites

1. A VPS with root SSH access (ours: Contabo, Ubuntu).
2. A domain with DNS pointing at the VPS:
   - `A` record: `sureboyrealty.com` → VPS IP
   - (optional) `A` record: `www` → VPS IP
   - Verify: `ping -c 2 sureboyrealty.com` shows the VPS IP **before** deploying
     (Caddy can't issue a certificate until DNS resolves to the server).
3. Docker + Docker Compose v2 on the VPS:
   ```bash
   curl -fsSL https://get.docker.com | sh
   docker compose version
   ```

---

## 3. First-time deployment

### 3.1 Clone the repo
```bash
git clone <your-git-url> Realestate
cd Realestate
```
All `docker compose` commands MUST be run from inside this folder (it contains
`docker-compose.yml`).

### 3.2 Generate secrets
```bash
openssl rand -base64 48                                  # JWT_SECRET
openssl rand -hex 32                                     # POSTGRES_PASSWORD (hex = URL-safe!)
docker run --rm node:20-alpine npx -y web-push generate-vapid-keys   # VAPID keys
```
> POSTGRES_PASSWORD must be **hex** (no `/`, `+`, `@`). Those characters break
> the `postgres://user:PASSWORD@host` connection URL.

### 3.3 Create `.env`
```bash
cp .env.docker.example .env
nano .env
```
`.env` is gitignored (never committed). Fill in (example — use YOUR values):
```env
# Database
POSTGRES_DB=sureboy_realty
POSTGRES_USER=app_user
POSTGRES_PASSWORD=<openssl rand -hex 32 output>

# Auth
JWT_SECRET=<openssl rand -base64 48 output>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Public origin / cookies (HTTPS)
PUBLIC_ORIGIN=https://sureboyrealty.com
REFRESH_COOKIE_SECURE=true

# HTTPS edge (Caddy)
APP_DOMAIN=sureboyrealty.com
ACME_EMAIL=you@example.com
HTTP_PORT=127.0.0.1:8080          # CRITICAL: frees port 80 for Caddy

# Web Push (VAPID)
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:you@example.com

# Private admin paths (long & random — keep secret)
ADMIN_BASE_PATH=/control-<random>
ADMIN_API_PATH=/core-<random>

# Misc
VITE_API_TIMEOUT=30000
RUST_LOG=info
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=60

# Backups
POSTGRES_BACKUP_SCHEDULE=@daily
POSTGRES_BACKUP_KEEP_DAYS=7
POSTGRES_BACKUP_KEEP_WEEKS=4
POSTGRES_BACKUP_KEEP_MONTHS=6
```
> `ADMIN_BASE_PATH` and `VAPID_PUBLIC_KEY` are compiled into the frontend at
> **build time**. They must be correct in `.env` BEFORE the first build (see
> gotchas 4 and 5).

### 3.4 Free port 80 (disable any host web server)
Fresh VPS images often ship a host nginx/apache on port 80, which collides with
Caddy:
```bash
sudo ss -tlnp | grep ':80'                 # see what's on 80
sudo systemctl stop nginx apache2
sudo systemctl disable nginx apache2       # stop it returning on reboot
sudo ss -tlnp | grep ':80'                 # confirm 80 is free
```

### 3.5 Open the firewall
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 443/udp                     # HTTP/3
```
> Contabo also has a separate firewall in their web panel — if the site is
> unreachable after deploy, check there too.

### 3.6 Launch (with HTTPS overlay)
Use `screen` so a dropped SSH connection doesn't kill the slow Rust build:
```bash
screen -S deploy
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
# detach: Ctrl+A then D   |   reattach: screen -r deploy
```
First build is slow (Rust release + LTO, ~8–15 min).

### 3.7 Verify
```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml ps         # all "healthy"
docker compose -f docker-compose.yml -f docker-compose.https.yml logs -f caddy   # "certificate obtained"
curl -sI https://sureboyrealty.com | head -1                                 # HTTP/2 200
curl https://sureboyrealty.com/api/health
```

### 3.8 Create the super admin
Open in a browser (use YOUR `ADMIN_BASE_PATH`):
```
https://sureboyrealty.com/<ADMIN_BASE_PATH>/signup
```
Register the first account, then log in at `/<ADMIN_BASE_PATH>/login`.

### 3.9 Final feature checks
- Open a property with a video → it plays in the custom player/carousel.
- Copy the video URL, paste into a fresh tab → should return **403** (link protection).
- Admin dashboard → **Enable Alerts** → allow the browser prompt.
- From another device, submit the public contact form → a push with the logo
  should arrive on the admin device.

---

## 4. Updating after you push new code

```bash
cd ~/Realestate
git pull
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```
- Rebuilds only changed images; recreates only affected containers.
- **Data is preserved.** Migrations run automatically on API start.
- Frontend-only change? Faster: append ` frontend` to the command.
- API (Rust) change is slow — use `screen`.
- ALWAYS pass both `-f` files, or Caddy/HTTPS gets torn down.

---

## 5. Safety rules (read this twice)

| Command | Effect | Safe on live site? |
| --- | --- | --- |
| `docker compose ... down` | removes containers only | ✅ data kept |
| `docker compose ... up -d --build` | rebuild + restart | ✅ data kept |
| `docker compose ... down -v` | removes containers **and volumes** | ❌ **DELETES ALL DATA** |

`-v` wipes the database (admins, properties, messages) AND uploads. It is
**unrecoverable** from the volume. We only used it once during setup because the
DB was empty. **Never use `-v` again on a live site.** Daily backups exist
(`postgres-backup`) but don't rely on that as an undo button.

---

## 6. Database access

```bash
# Open a psql shell (no password prompt — uses the trusted local socket)
docker compose -f docker-compose.yml -f docker-compose.https.yml exec postgres \
  psql -U app_user -d sureboy_realty

# Inside psql:
\dt                                              -- list tables
SELECT id, email, created_at FROM admin_users;   -- confirm admin accounts
\q                                               -- quit

# One-liner to verify the super admin exists:
docker compose -f docker-compose.yml -f docker-compose.https.yml exec postgres \
  psql -U app_user -d sureboy_realty -c "SELECT id, email, created_at FROM admin_users;"
```

Backups:
```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml exec postgres-backup ls -la /backups
```

---

## 7. Troubleshooting (everything we actually hit)

### 7.1 `cargo check` fails locally on Windows (OpenSSL/perl error)
The `web-push` crate pulls in vendored OpenSSL, which needs a Perl toolchain
Windows Git-Bash lacks. **This is expected** — the deployment target is
Docker/Linux, where it builds fine. Verify with `docker compose build api`, not
local `cargo check`.

### 7.2 API unhealthy: `password authentication failed for user "app_user"` (28P01)
Postgres only sets its password the **first time** its data volume is created.
If you change `POSTGRES_PASSWORD` in `.env` after that, Postgres keeps the old
one and the API can't connect.
- **If the DB is empty (fresh setup):** wipe and re-init —
  `docker compose ... down -v` then `up -d`. (Only safe when there's no data.)
- **If the DB has real data:** do NOT use `-v`. Change the password inside the
  running database instead (`ALTER USER app_user WITH PASSWORD '...';`) to match
  `.env`, or revert `.env` to the original password.

### 7.3 `failed to bind host port 0.0.0.0:80: address already in use`
Something on the host owns port 80.
- Usually a host nginx/apache: `sudo ss -tlnp | grep ':80'`, then
  `sudo systemctl stop nginx apache2 && sudo systemctl disable nginx apache2`.
- If `HTTP_PORT` is not `127.0.0.1:8080`, the frontend tries to grab 80 and
  collides with Caddy — set `HTTP_PORT=127.0.0.1:8080` in `.env`, then
  `down` + `up -d`.

### 7.4 Admin path returns 404 (e.g. `/control-xxxx/signup`)
`ADMIN_BASE_PATH` is baked into the frontend at **build time**. If the frontend
was built before `.env` had the right value, it defaulted to `/control-panel`.
Rebuild the frontend so it picks up the current `.env`:
```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build frontend
```
(Tip: the old default `https://sureboyrealty.com/control-panel/signup` will work
until you rebuild — proof it's a build-time mismatch.)

### 7.5 Web Push / "Enable Alerts" does nothing or says not configured
- Requires **HTTPS** (or localhost) — it won't work over plain `http://IP`.
- `VAPID_PUBLIC_KEY` must be set in `.env` **before the frontend build**
  (it's compiled into the bundle). Rebuild frontend after setting it.
- `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` must be set for the API to send.
- Generate keys ONLY with `npx web-push generate-vapid-keys` (exact base64 format).
- No push arriving? Check `docker compose ... logs api` for notifier warnings.

### 7.6 SSH keeps disconnecting (`client_loop: send disconnect`)
- Reconnect: `ssh root@sureboyrealty.com`. Confirm the prompt is the VPS
  (`root@vmi...`), not your local PowerShell (`PS C:\...`) — commands run on
  whichever you're actually on.
- Use `screen` for long builds so a disconnect doesn't interrupt them.

### 7.7 Caddy won't get a certificate
- DNS must point at the VPS first (`ping sureboyrealty.com`).
- Port 80 must be free and open (firewall + no host nginx).
- Watch `docker compose ... logs -f caddy` for the specific ACME error.

---

## 8. Quick command reference

```bash
# Deploy / update (HTTPS)
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build

# Logs
docker compose -f docker-compose.yml -f docker-compose.https.yml logs -f
docker compose -f docker-compose.yml -f docker-compose.https.yml logs -f api

# Status / restart
docker compose -f docker-compose.yml -f docker-compose.https.yml ps
docker compose -f docker-compose.yml -f docker-compose.https.yml restart api

# Stop (safe — keeps data)
docker compose -f docker-compose.yml -f docker-compose.https.yml down
```

> Define an alias to avoid typing both files every time:
> `alias dc='docker compose -f docker-compose.yml -f docker-compose.https.yml'`
> then just `dc up -d --build`, `dc logs -f api`, etc.
