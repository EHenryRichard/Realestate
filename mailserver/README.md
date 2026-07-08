# Sureboy Realty — Self-hosted mail server (docker-mailserver)

A complete, production-ready mail server running entirely in Docker on the Ubuntu
VPS. Provides SMTP (send), IMAP (read), SMTP AUTH, OpenDKIM, OpenDMARC, SPF
checking, SSL/TLS, and Fail2Ban.

- **Domain:** `sureboyrealty.com`
- **Mail hostname:** `mail.sureboyrealty.com`
- **Mailboxes:** `support@`, `noreply@`, `postmaster@`
- The app sends via **`noreply@sureboyrealty.com`** over SMTP.
- `support@` is a real mailbox you can add to Gmail/Thunderbird/Outlook (IMAP+SMTP).

> ⚠️ **Read the "What stays OUTSIDE Docker" section (15) first.** DNS, reverse DNS,
> the Let's Encrypt cert, and the firewall are host/registrar tasks — they cannot
> be created inside a container.

---

## 1. Project folder structure
```
mailserver/
├── docker-compose.yml          # the DMS service
├── mailserver.env              # config (no passwords)
├── README.md                   # this file
└── docker-data/                # created on first run — persistent data (DO NOT commit)
    └── dms/
        ├── config/             # accounts, aliases, DKIM keys
        ├── mail-data/          # the actual mailboxes
        ├── mail-state/         # runtime state
        └── mail-logs/          # mail.log
```

## 2. docker-compose.yml
Already generated — see `docker-compose.yml` in this folder. Key points: image
`ghcr.io/docker-mailserver/docker-mailserver:latest`, `hostname:
mail.sureboyrealty.com`, ports `25/465/587/993`, `/etc/letsencrypt` mounted
read-only, `cap_add: NET_ADMIN` for Fail2Ban, persistent bind mounts.

## 3. mailserver.env
Already generated — see `mailserver.env`. `SSL_TYPE=letsencrypt`, OpenDKIM +
OpenDMARC + policyd-SPF enabled, Fail2Ban on, heavy scanners off. **No passwords.**

## 4. Setup commands (order matters)
```bash
# 0) On the VPS, get the code onto the box (or scp the mailserver/ folder up).
cd /opt/sureboy/mailserver          # wherever the repo lives

# 1) DNS A record + PTR + port 25 unblock must be done first (sections 10, 11, 12).

# 2) Issue the TLS certificate on the HOST (section 5).

# 3) Start the mail server.
docker compose up -d
docker compose logs -f              # watch it boot (Ctrl-C to stop watching)

# 4) Create mailboxes (section 8) and generate DKIM (section 9).

# 5) Add the DKIM/SPF/DMARC DNS records (section 10), then test (section 13).
```

## 5. Let's Encrypt SSL/TLS for mail.sureboyrealty.com
DMS reads the cert from the mounted `/etc/letsencrypt`; **certbot runs on the
host** (not in Docker). The ACME HTTP-01 challenge needs **port 80**.

> On this VPS the app's web container / Caddy already binds port 80. Free it for
> the ~30s issuance (`docker stop <app-web-or-caddy-container>`), or proxy the
> ACME path through Caddy. (Alternative: let Caddy manage this cert and switch to
> `SSL_TYPE=manual` — but the spec here is certbot + `/etc/letsencrypt`.)

```bash
sudo apt-get update && sudo apt-get install -y certbot

# Make sure mail.sureboyrealty.com A record already points to this VPS.
sudo certbot certonly --standalone \
  -d mail.sureboyrealty.com \
  --agree-tos -m postmaster@sureboyrealty.com -n
# Cert now at: /etc/letsencrypt/live/mail.sureboyrealty.com/{fullchain.pem,privkey.pem}
```

**Auto-renewal** — restart DMS after each renewal so it reloads the new cert:
```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/restart-mailserver.sh >/dev/null <<'EOF'
#!/bin/sh
docker restart mailserver
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-mailserver.sh
# certbot installs its own renew timer; test it with:
sudo certbot renew --dry-run
```

## 6. SMTP authentication setup
Enabled automatically. Clients/apps authenticate on:
- **587** (STARTTLS) — recommended for apps.
- **465** (implicit TLS/SMTPS) — also supported.
`SPOOF_PROTECTION=1` means an authenticated user may only send *as their own*
address (so `noreply@` can't be used to spoof `support@`, etc.).

## 7. IMAP login setup
IMAP over TLS is served on **993**. Mail-client settings for `support@`:
| Setting | Value |
|---|---|
| IMAP server | `mail.sureboyrealty.com`, port **993**, SSL/TLS |
| SMTP server | `mail.sureboyrealty.com`, port **587** (STARTTLS) or **465** (SSL) |
| Username | `support@sureboyrealty.com` (the **full** address) |
| Password | the one you set in section 8 |

## 8. Create email accounts (passwords entered interactively — never in git)
```bash
docker exec -ti mailserver setup email add noreply@sureboyrealty.com
docker exec -ti mailserver setup email add support@sureboyrealty.com
docker exec -ti mailserver setup email add postmaster@sureboyrealty.com

# List / change / delete later:
docker exec -ti mailserver setup email list
docker exec -ti mailserver setup email update noreply@sureboyrealty.com
docker exec -ti mailserver setup email del  someone@sureboyrealty.com
```
Passwords are prompted and stored **only as salted hashes** in
`docker-data/dms/config/postfix-accounts.cf`.

Put the `noreply@` password into the **app's** `.env` (not this project's):
```env
SMTP_HOST=mail.sureboyrealty.com
SMTP_PORT=587
SMTP_USERNAME=noreply@sureboyrealty.com
SMTP_PASSWORD=<the noreply password you just set>
MAIL_FROM=noreply@sureboyrealty.com
MAIL_FROM_NAME=Sureboy Realty
```
then `docker compose up -d api` in the app project.

## 9. DKIM generation
```bash
# Generate a 2048-bit DKIM key with selector "mail" for the domain.
docker exec -ti mailserver setup config dkim keysize 2048 selector mail domain sureboyrealty.com

# Print the DNS record value to copy into your DNS panel:
cat docker-data/dms/config/opendkim/keys/sureboyrealty.com/mail.txt
```
The file contains the `p=` public key for the `mail._domainkey` record below.
Restart so signing picks up the key: `docker restart mailserver`.

## 10. DNS records (create these in the **Contabo DNS panel**)
Replace `YOUR_VPS_IP` with the server's public IPv4. Use the DKIM `p=` value
printed in section 9.

| Name | TTL | Type | Data |
|---|---|---|---|
| `mail` | 3600 | A | `YOUR_VPS_IP` |
| `@` | 3600 | MX | `10 mail.sureboyrealty.com.` |
| `@` | 3600 | TXT | `v=spf1 mx ~all` |
| `mail._domainkey` | 3600 | TXT | `v=DKIM1; h=sha256; k=rsa; p=<PUBLIC_KEY_FROM_mail.txt>` |
| `_dmarc` | 3600 | TXT | `v=DMARC1; p=quarantine; rua=mailto:postmaster@sureboyrealty.com; ruf=mailto:postmaster@sureboyrealty.com; fo=1; adkim=s; aspf=s` |

Notes:
- The DKIM `p=` value may be split across quoted strings in `mail.txt` — join them
  into one continuous string (no spaces) when pasting.
- SPF `~all` = softfail (safe while testing). Tighten to `-all` once verified.
- DMARC `p=quarantine` is a safe start; move to `p=reject` after a week of clean
  reports.

## 11. Reverse DNS / PTR (create in the **Contabo Reverse DNS panel**)
Set the PTR for `YOUR_VPS_IP` → **`mail.sureboyrealty.com`**. This is done in
Contabo's control panel, **not** in DNS and **not** in Docker. Gmail/Outlook
reject mail from IPs whose PTR doesn't match the sending hostname.

## 12. Firewall ports to open (UFW on the host)
```bash
sudo ufw allow 25/tcp      # SMTP
sudo ufw allow 465/tcp     # SMTPS
sudo ufw allow 587/tcp     # Submission
sudo ufw allow 993/tcp     # IMAPS
sudo ufw allow 80/tcp      # HTTP — needed for certbot ACME + your app
sudo ufw allow 443/tcp     # HTTPS — your app
sudo ufw allow OpenSSH     # don't lock yourself out
sudo ufw enable
sudo ufw status verbose
```
Also open a **Contabo support ticket to unblock outbound port 25** — it's blocked
by default and you cannot send external mail without it.

## 13. Test commands
```bash
# --- TLS / SSL certificate ---
echo | openssl s_client -connect mail.sureboyrealty.com:465 2>/dev/null \
  | openssl x509 -noout -subject -dates

# --- SMTP submission (STARTTLS) reachable? ---
openssl s_client -starttls smtp -connect mail.sureboyrealty.com:587
# --- SMTPS (implicit TLS) ---
openssl s_client -connect mail.sureboyrealty.com:465

# --- IMAP over TLS ---
openssl s_client -connect mail.sureboyrealty.com:993
# then type:  a login support@sureboyrealty.com YOURPASSWORD    (a logout to quit)

# --- Send a real authenticated test email (install swaks) ---
sudo apt-get install -y swaks
swaks --server mail.sureboyrealty.com:587 --tls \
  --auth LOGIN --auth-user noreply@sureboyrealty.com \
  --to you@gmail.com --from noreply@sureboyrealty.com \
  --header "Subject: DMS test" --body "Hello from Sureboy Realty."

# --- Verify DNS is published (DKIM / SPF / DMARC / MX / PTR) ---
dig +short MX  sureboyrealty.com
dig +short TXT sureboyrealty.com                     # SPF
dig +short TXT mail._domainkey.sureboyrealty.com     # DKIM
dig +short TXT _dmarc.sureboyrealty.com              # DMARC
dig +short -x YOUR_VPS_IP                            # PTR should be mail.sureboyrealty.com

# --- End-to-end auth check (best single test) ---
# Send an email to this address and read the report it emails back:
#   check-auth@verifier.port25.com
# Or send to a fresh address at https://www.mail-tester.com and aim for 10/10.
```

## 14. Troubleshooting (logs & container status)
```bash
docker ps                                    # is the container up/healthy?
docker compose logs -f mailserver            # live logs
docker exec -ti mailserver cat /var/log/mail/mail.log | tail -n 100
docker exec -ti mailserver supervisorctl status   # per-service (postfix, dovecot, opendkim…)

# Built-in DMS diagnostics:
docker exec -ti mailserver setup debug fail2ban        # bans / status
docker exec -ti mailserver setup debug show-mail-logs
docker exec -ti mailserver postconf -n                 # effective Postfix config
docker exec -ti mailserver doveconf -n                 # effective Dovecot config

# Common issues:
#  • Mail stuck / can't send externally  → port 25 not unblocked by Contabo.
#  • TLS errors on boot                  → cert missing at /etc/letsencrypt/live/mail.sureboyrealty.com/.
#  • Lands in spam                       → PTR wrong, or DKIM/SPF/DMARC not published/propagated.
#  • Auth fails from the app             → wrong mailbox password / using port 25 instead of 587/465.
```

## 15. What stays OUTSIDE Docker (cannot be containerised)
- **DNS records** (A, MX, SPF, DKIM, DMARC) → created in the **Contabo DNS panel**
  (section 10). A container cannot publish public DNS.
- **Reverse DNS / PTR** → created in the **Contabo Reverse DNS panel** (section 11).
  Only the IP owner (Contabo) can set this.
- **Outbound port 25 unblock** → a **Contabo support request**.
- **Let's Encrypt certificate** → issued by **certbot on the host** (section 5); DMS
  only *reads* the mounted cert.
- **Host firewall (UFW)** and **the VPS itself** → host-level.

Everything else — Postfix, Dovecot, SMTP AUTH, IMAP, OpenDKIM, OpenDMARC, SPF
policy, TLS termination, Fail2Ban — runs **inside the single Docker container**.
