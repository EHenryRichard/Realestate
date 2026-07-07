# Email setup (password-reset links)

The API sends password-reset emails over **SMTP**, configured purely by env vars
(`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`,
`MAIL_FROM_NAME`). The code does not care *who* the SMTP server is — it works the
same with a self-hosted mailcow, a cPanel/Namecheap mailbox, or any provider.

If `SMTP_HOST` is blank the app still boots; reset emails are skipped and a
warning is logged. So you can ship first and wire email later.

- Port **465** → implicit TLS (SSL).
- Port **587** → STARTTLS (default).

---

## Option chosen: self-host a mailbox on the VPS with mailcow

`mailcow-dockerized` gives you the cPanel-style experience: a web UI to create
mailboxes, automatic DKIM keys, Dovecot (IMAP, so you can read mail in Gmail),
Postfix (SMTP, so the app can send), Rspamd anti-spam, and webmail.

### 0. Prerequisites (do these first — most failures are here)
1. **A subdomain for mail**, e.g. `mail.your-domain.com`, pointing (A/AAAA) to the
   VPS IP.
2. **Unblock outbound port 25.** Budget VPS hosts (Contabo, etc.) block it by
   default. Open a support ticket asking them to unblock SMTP port 25 — without
   this you cannot send mail at all.
3. **rDNS / PTR record** for the VPS IP set to `mail.your-domain.com` (do this in
   the VPS provider's panel, not your DNS host).
4. mailcow wants ports 25, 465, 587, 143, 993, 110, 995, 4190 and (for its own
   UI/ACME) 80/443. Your app already uses 80/443 via Caddy — see "Port conflict"
   below.

### 1. Install mailcow
Run on a host with Docker + docker compose (ideally its own small box; see the
note about co-hosting with the app):

```bash
cd /opt
git clone https://github.com/mailcow/mailcow-dockerized
cd mailcow-dockerized
./generate_config.sh          # asks for the mail hostname → mail.your-domain.com
docker compose pull
docker compose up -d
```

Then open `https://mail.your-domain.com`, log in (default `admin` / `moohoo` —
change it immediately), and:
- **Configuration → Mail Setup → Domains** → add `your-domain.com`.
- **Mailboxes** → add `noreply@your-domain.com` with a strong password.
- **Configuration → ARC/DKIM** → generate a DKIM key for the domain.

### 2. DNS records (at your domain registrar)
mailcow shows you the exact values; you need at least:
- **MX** → `mail.your-domain.com` (priority 10)
- **SPF** (TXT on root): `v=spf1 mx ~all`
- **DKIM** (TXT, the record mailcow generated, e.g. `dkim._domainkey`)
- **DMARC** (TXT on `_dmarc`): `v=DMARC1; p=quarantine; rua=mailto:postmaster@your-domain.com`
- **PTR/rDNS** (provider panel) → `mail.your-domain.com`

Give DNS time to propagate, then test deliverability at https://www.mail-tester.com.

### 3. Point the app at the mailbox
In the project root `.env`:

```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USERNAME=noreply@your-domain.com
SMTP_PASSWORD=the-mailbox-password
MAIL_FROM=noreply@your-domain.com
MAIL_FROM_NAME=Sureboy Realty
```

Recreate the API container so it picks up the new env:
```bash
docker compose up -d api
```

### Port conflict with the app (important)
mailcow's own Nginx wants 80/443, which your Caddy/frontend already owns on the
same machine. Two clean ways out:
- **Run mailcow on a separate small VPS** (simplest, recommended). The app just
  points `SMTP_HOST` at it over the network.
- **Co-host:** in `mailcow.conf` set `HTTP_BIND`/`HTTPS_BIND` to a localhost port
  (e.g. `127.0.0.1:8443`) and reverse-proxy `mail.your-domain.com` through your
  existing Caddy. The SMTP/IMAP ports (25/465/587/993…) stay on mailcow.

### Reading the mailbox in Gmail (optional)
In Gmail → Settings → Accounts → "Check mail from other accounts" (IMAP) and
"Send mail as" (SMTP), using the same `mail.your-domain.com` host and the
mailbox credentials. This is independent of how the app sends.

---

## Switching providers later
Nothing in the code changes. To move from mailcow to a cPanel/Namecheap mailbox
or a provider, just change the six `SMTP_*` / `MAIL_*` env values and
`docker compose up -d api`.

08105940343.