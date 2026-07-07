# Sureboy Realty — Test Checklist

Covers everything built recently: admin two-super-admin rules, admin
forgot-password, email (SMTP), and the full client platform (accounts, dashboard,
email alerts, and web-push). Tick each box.

> Not built yet (nothing to test): phone SMS OTP (pending Termii/Twilio), and any
> KYC / transactions (deliberately excluded).

### Related setup docs (do the setup BEFORE these tests)
- **Mail server (mailcow) install + DNS:** see `MAIL_SETUP.md`. Email tests below
  (verification, reset, alerts) all assume a working mailbox from that guide.
- **Env values:** `.env` (live) and `.env.docker.example` (reference) — SMTP,
  `PASSWORD_RESET_EXPIRES_IN`, `EMAIL_VERIFICATION_EXPIRES_IN`, VAPID keys, admin
  paths, `REFRESH_COOKIE_SECURE`.

---

## 0. Setup / prerequisites (do these first)
- [ ] `docker compose up -d --build` — migrations run automatically on API start; API container is healthy.
- [ ] Env sanity: `JWT_SECRET` set; `ADMIN_API_PATH` / `ADMIN_BASE_PATH` match what the frontend image was built with; `FRONTEND_URL` / `PUBLIC_ORIGIN` correct.
- [ ] Email: `SMTP_HOST/PORT/USERNAME/PASSWORD/MAIL_FROM` set (mailcow). If blank, the app still boots and just logs "email disabled."
- [ ] Push: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` set. Push needs HTTPS or localhost.
- [ ] Cookies: on HTTPS set `REFRESH_COOKIE_SECURE=true`.

## 1. Admin login (the original 401 — regression)
- [ ] Admin login works on the hosted site, not just Docker.
- [ ] After login, refreshing the page keeps you logged in (refresh-cookie session restore).
- [ ] Session survives past the 15-min access-token expiry (silent refresh).

## 2. Two super admins + founder protection
- [ ] Signup works only once — a second signup returns "Initial admin already exists." The first admin shows a "primary" badge on the Team page.
- [ ] Primary admin creates a second admin (Team → Add Member, role = Admin) → succeeds.
- [ ] Trying to add a third admin → rejected ("only two super admins").
- [ ] Second admin cannot delete, demote, or deactivate the primary (buttons hidden + API rejects if forced).
- [ ] Primary can delete the second admin.
- [ ] Nobody can delete the primary (even the primary).
- [ ] Ordinary agents are still deletable by any admin.
- [ ] Promoting an agent to admin respects the cap of 2.

## 3. Admin forgot-password
- [ ] "Forgot password?" → enter email → generic "if it exists…" message (same reply for a non-existent email — no leak).
- [ ] Reset email arrives with a link; opening it → set new password → login works with it.
- [ ] Single-use: reusing the same link after a successful reset → fails.
- [ ] Expired link (older than `PASSWORD_RESET_EXPIRES_IN`) → fails cleanly.
- [ ] Tampered / garbage token → "invalid or expired."

## 4. Email delivery (mailcow / SMTP)
Setup steps are in `MAIL_SETUP.md`. Verify the setup itself first, then delivery:
- [ ] Mailcow admin UI reachable at `https://mail.your-domain.com`; the mailbox (e.g. `noreply@…`) exists and its password matches `SMTP_PASSWORD`.
- [ ] Outbound **port 25 is unblocked** by the VPS host (Contabo blocks it by default).
- [ ] DNS: **MX**, **SPF**, **DKIM**, **DMARC**, and **PTR/rDNS** records all present.
- [ ] `mail-tester.com` score is good (10/10 ideally) — proves inbox placement, not spam.
- [ ] Verification, reset, and alert emails actually arrive in the inbox (not spam).
- [ ] With `SMTP_HOST` blank: app runs; email actions log a skip instead of crashing.

## 5. Client accounts (Phase 1)
- [ ] Browsing works with no account (home, properties, property detail, agents) — nothing gated.
- [ ] Register → immediately logged in and on `/dashboard`; confirmation email sent.
- [ ] Dashboard shows a "confirm your email" banner; Resend link works; clicking the emailed link → "Email verified" and the banner disappears.
- [ ] Verifying an already-verified account still succeeds (idempotent); expired/invalid verify token → fails.
- [ ] Duplicate email on register → rejected.
- [ ] Login / logout; wrong password → vague "Invalid credentials."
- [ ] Reload while logged in → session restored.
- [ ] Header person icon → dashboard when logged in, login when not.

## 6. Dashboard entities (saved / viewed / inquiries)
- [ ] Open a couple of property pages → they appear under Recently viewed (most-recent first, no duplicates).
- [ ] Save a property (heart) → shows under Saved; Remove takes it off.
- [ ] From a property, message an agent → success; it appears under My inquiries; empty message is blocked.
- [ ] Signed-out on a property page → sees the "sign in to save / message" nudge (can still browse).

## 7. Preference-based email alerts (Phase 2)
- [ ] Set preferences (locations e.g. "Port Harcourt, Delta", type, max price, min bedrooms, email alerts ON) → reload → values persist.
- [ ] Admin publishes a matching property → the opted-in, verified client gets an email.
- [ ] A non-matching property (wrong location/type/over budget/too few beds) → no email.
- [ ] Client with email alerts OFF → no email. Unverified client → no email.
- [ ] Publishing a hidden (not visible) property → no alerts to anyone.
- [ ] Empty filters = matches everything (a client who only toggled alerts on gets all new listings).

## 8. Client web-push
- [ ] On `/dashboard`, Enable phone/browser alerts → permission prompt → "Enabled."
- [ ] Admin publishes a matching property → push notification appears; clicking it opens that property.
- [ ] Disable → no more pushes.
- [ ] Isolation: admin lead alerts do NOT reach client devices, and client listing alerts do NOT reach admin devices.
- [ ] A push-only client (push on, email alerts off) still gets a push for matches.
- [ ] Unsupported browser / blocked permission → the toggle shows a clear reason, no crash.

## 9. Cross-cutting security & regression
- [ ] Admin and client can be logged in simultaneously in the same browser without clobbering each other (separate cookies/paths).
- [ ] A client token can't hit admin endpoints, and an admin token can't hit client endpoints.
- [ ] Existing public features still work: properties list/detail, blog, services, testimonials, FAQs, contact form, agents/team, video streaming.

## 10. Deploy-specific (hosted)
- [ ] `REFRESH_COOKIE_SECURE=true` on HTTPS; both admin and client login persist across reload.
- [ ] For mailcow: port 25 unblocked, PTR/SPF/DKIM set, and a real mail-tester score before trusting alerts.
