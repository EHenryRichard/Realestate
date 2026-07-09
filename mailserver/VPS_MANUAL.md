# Sureboy Realty — Mail Server VPS Manual (what actually worked)

The exact, ordered steps we used to stand up **docker-mailserver** on the Contabo
VPS for `sureboyrealty.com`, with the real container names, paths, and the
problems we hit + their fixes.

**Environment (real values):**
- VPS: Contabo, hostname `vmi3365517`, public IP ≈ `13.140.170.198`
- Domain DNS: **Namecheap** (nameservers `dns1/dns2.registrar-servers.com`) — **NOT Contabo**
- App project dir: `~/Realestate` (containers prefixed `realestate-…`)
- Reverse proxy owning ports 80/443: container **`realestate-caddy-1`**
- Mail project dir: `~/Realestate/mailserver`
- Mail hostname: `mail.sureboyrealty.com`
- Mailboxes: `noreply@`, `support@`, `postmaster@sureboyrealty.com`

> Golden rule that tripped us up: **DNS records go in Namecheap; only PTR and the
> port-25 unblock happen in Contabo.**

---

## 1. Contabo panel (do first — these take time)
- **Reverse DNS / PTR:** set the VPS IP → `mail.sureboyrealty.com`.
- **Support ticket:** ask Contabo to **unblock outbound port 25** (blocked by default).

## 2. Namecheap DNS — the `mail` A record (needed before the cert)
Namecheap → Domain List → `sureboyrealty.com` → **Manage → Advanced DNS → Host Records → Add New Record**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `mail` | `13.140.170.198` (your VPS IP) | Automatic |

Confirm from the VPS (query a public resolver, not just local):
```bash
dig +short mail.sureboyrealty.com @1.1.1.1     # must return your VPS IP
```

## 3. TLS certificate (certbot on the host)
Caddy owns port 80, so stop it for ~30s while certbot runs, then restart:
```bash
sudo apt-get update && sudo apt-get install -y certbot

docker stop realestate-caddy-1

sudo certbot certonly --standalone -d mail.sureboyrealty.com \
  --agree-tos -m postmaster@sureboyrealty.com -n

docker start realestate-caddy-1

# verify the cert exists:
sudo ls /etc/letsencrypt/live/mail.sureboyrealty.com/
# → cert.pem  chain.pem  fullchain.pem  privkey.pem  README
```
Auto-renew hook (restart mail after each renewal):
```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/restart-mailserver.sh >/dev/null <<'EOF'
#!/bin/sh
docker restart mailserver
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-mailserver.sh
sudo certbot renew --dry-run
```

## 4. Firewall (if ufw is enabled)
```bash
sudo ufw allow 25,465,587,993/tcp
sudo ufw allow 80,443/tcp
sudo ufw allow OpenSSH
```

## 5. Start the mail server
The `mailserver/` folder (docker-compose.yml + mailserver.env) must be on the VPS.
```bash
cd ~/Realestate/mailserver
docker compose up -d
docker compose logs -f mailserver     # Ctrl-C to stop watching
```
> Expected on first boot: `You need at least one mail account to start Dovecot`
> (a countdown) and some `ERROR sedfile: No difference…` lines. **Both are normal** —
> the sed lines are harmless, and Dovecot starts once you add the first mailbox (next step).

## 6. Create the mailboxes (passwords are prompted, never stored in files)
```bash
docker exec -ti mailserver setup email add noreply@sureboyrealty.com
docker exec -ti mailserver setup email add support@sureboyrealty.com
docker exec -ti mailserver setup email add postmaster@sureboyrealty.com

docker exec -ti mailserver setup email list      # confirm all three exist
```
👉 **Save the `noreply@` password** — the app needs it.

## 7. Generate DKIM + read the public key
```bash
docker exec -ti mailserver setup config dkim keysize 2048 selector mail domain sureboyrealty.com
docker restart mailserver
cat ~/Realestate/mailserver/docker-data/dms/config/opendkim/keys/sureboyrealty.com/mail.txt
```
Join the quoted chunks in `mail.txt` into one continuous string for the DNS value.

## 8. Namecheap DNS — the rest of the records
**MX** is special in Namecheap: scroll to **MAIL SETTINGS** → set the dropdown to
**Custom MX** (this disables Namecheap email forwarding), then:

| Where | Host | Value | Priority |
|-------|------|-------|----------|
| Mail Settings → Custom MX | `@` | `mail.sureboyrealty.com` | `10` |

**TXT records** in Host Records → Add New Record → **TXT Record**:

| Host | Value |
|------|-------|
| `@` | `v=spf1 mx ~all` |
| `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@sureboyrealty.com; adkim=s; aspf=s` |
| `mail._domainkey` | `v=DKIM1; h=sha256; k=rsa; p=<joined key from mail.txt>` |

Verify once propagated:
```bash
dig +short MX  sureboyrealty.com @1.1.1.1
dig +short TXT sureboyrealty.com @1.1.1.1                 # SPF
dig +short TXT _dmarc.sureboyrealty.com @1.1.1.1
dig +short TXT mail._domainkey.sureboyrealty.com @1.1.1.1 # DKIM
dig +short -x 13.140.170.198                              # PTR → mail.sureboyrealty.com
```

## 9. Point the APP at the mailbox
Edit `~/Realestate/.env` (the app's, not the mailserver's):
```env
SMTP_HOST=mail.sureboyrealty.com
SMTP_PORT=587
SMTP_USERNAME=noreply@sureboyrealty.com
SMTP_PASSWORD=<the noreply password>
MAIL_FROM=noreply@sureboyrealty.com
MAIL_FROM_NAME=Sureboy Realty
# Needed for the logo in emails + correct verify/reset/push links:
PUBLIC_ORIGIN=https://sureboyrealty.com
```
Apply (must be `up -d`, NOT `restart` — `restart` does not reload `.env`):
```bash
cd ~/Realestate
docker compose up -d api
docker compose exec api printenv SMTP_PASSWORD    # confirm the container got it
```

## 10. Test
```bash
sudo apt-get install -y swaks

# authenticated send (pass the password inline to avoid prompt issues):
swaks --server mail.sureboyrealty.com:587 --tls \
  --auth LOGIN --auth-user noreply@sureboyrealty.com --auth-password 'THE_PASSWORD' \
  --to you@gmail.com --from noreply@sureboyrealty.com \
  --header "Subject: DMS test" --body "Hello from Sureboy Realty."
```
A good result ends with `250 ... Ok: queued`. For the full score, send to
**check-auth@verifier.port25.com** or a fresh address at **mail-tester.com** (aim 10/10).

Real end-to-end test: register a new client on the site → the branded
verification email should arrive from `noreply@sureboyrealty.com`.

---

## Problems we hit → fixes (so you don't repeat them)

| Symptom | Cause | Fix |
|---|---|---|
| `docker stop sureboy-frontend-1` → "No such container" | Wrong name; VPS project is `realestate` | Stop **`realestate-caddy-1`** (it owns port 80) |
| certbot: "Could not bind TCP port 80" | Caddy still running | `docker stop realestate-caddy-1` first, start after |
| "mail record exists but VM can't see it" | DNS added in **Contabo**, but domain uses **Namecheap** NS | Add all DNS in **Namecheap Advanced DNS** |
| "there is no MX record type in Namecheap" | Namecheap puts MX under **Mail Settings** | Set **Custom MX** there, not in Host Records |
| Mail server log: "need at least one mail account" + `sedfile: No difference` | Normal startup before any mailbox / idempotent config | Add a mailbox (step 6); the sed lines are harmless |
| App emails fail: `535 5.7.8 authentication failed` | `SMTP_PASSWORD` in `.env` ≠ mailbox password, or API not recreated | Set the exact password, then `docker compose up -d api` (not `restart`); verify with `printenv SMTP_PASSWORD` |
| Push click / email links go to `http://localhost` | `PUBLIC_ORIGIN` still default | Set `PUBLIC_ORIGIN=https://sureboyrealty.com`, `docker compose up -d api` |
| Logo missing in emails | Same `PUBLIC_ORIGIN` issue (logo loads from `<PUBLIC_ORIGIN>/images/logo/logogreen.png`) | Set `PUBLIC_ORIGIN` correctly |

## Handy operations
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"   # what's running
docker compose logs -f mailserver                                # live mail logs
docker exec -ti mailserver setup email list                      # list mailboxes
docker exec -ti mailserver setup email update noreply@sureboyrealty.com   # change a password
docker exec -ti mailserver setup email del user@sureboyrealty.com         # remove a mailbox
docker exec -ti mailserver setup debug fail2ban                  # bans / status
```