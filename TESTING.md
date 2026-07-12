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

---

# Latest additions (agent signup, admin users, update alerts, UI)

## 11. Test locally (no email/push needed)

### 11a. Agent signup / approval flow
- [ ] Footer → **"Join Our Team"** (`/become-an-agent`) → fill form → submit → "request received".
- [ ] Admin → **Agent Forms** → the request appears under **Pending**.
- [ ] **Approve** → status becomes *approved* (locally the invite email is only logged). **Reject** works too.
- [ ] Status filter tabs (pending / approved / completed / rejected / all) filter correctly.
- [ ] (Server rule) The invite link is single-use: once an account is created the request becomes *completed* and the link stops working.

### 11b. Admin "Customers" (Users) page
- [ ] Columns: Name · Phone · Email (green ✓ verified / amber ! pending icon + hover tooltip) · Status · Joined.
- [ ] **Eye (Details)** button → modal with Saved / Viewed / Inquiries / Devices counts + push status + phone/verified/joined.
- [ ] **Edit** button → only Name + Phone (no stats block).
- [ ] Mark verified / Activate–Deactivate / Delete each work.
- [ ] Search + pagination work.

### 11c. Property slug / edits
- [ ] Re-create a property with the **same title** → saves as `…-2` (no refresh, no "duplicate slug" error).
- [ ] Editing a property saves cleanly.

### 11d. UI tweaks
- [ ] **Back-to-top** button appears on public pages after scrolling ~320px and smooth-scrolls up; **not** shown on the home page (it has its own via SectionNavigator).
- [ ] Active nav accent is **white**, not gold (admin sidebar/drawer + public mobile menu).
- [ ] **WhatsApp** floating button shows on the public site but **NOT** in the admin panel.

## 12. Test on the VPS (needs SMTP + VAPID configured)
- [ ] All emails are branded with the **green logo** (verification / reset / new-listing / agent invite).
- [ ] Approving an agent request actually **emails the invite link** → clicking it → set name + password → the agent can log in to the admin panel (agent role).
- [ ] **Update alerts** fire only on meaningful changes:
  - [ ] hidden → visible (goes live) → "new listing" alert
  - [ ] price drop on a visible property → "price drop" alert (email subject + push say *price drop*)
  - [ ] description/photo edits / price increase → **no** alert
- [ ] Push notification click opens the **specific property** (requires `PUBLIC_ORIGIN=https://sureboyrealty.com`).
- [ ] **Add to Home Screen** icon is the logo (delete + re-add the shortcut after deploying).
- [ ] Push notification icon/badge shows the logo.

## 13. Faster builds (verify once)
- [ ] First `docker compose build api` runs full; a **second** build after changing only app code finishes in well under 2 min (cargo-chef caches deps; mold speeds linking).

## 14. Admin-editable About page + categorized sidebar (test locally)

### 14a. About page from the admin
- [ ] Admin → **Website Content → About Page** → editor loads pre-filled with the current copy (falls back to the shipped copy the first time).
- [ ] Edit the banner title, intro, a value card (add/remove works), founder bio, and closing → **Save** → success toast.
- [ ] Public `/about` reflects the saved changes on reload; images uploaded in the editor show on the page.
- [ ] Blank / never-saved state: `/about` still renders the bundled default content (no blank sections).

### 14b. Categorized sidebar + agent sub-list
- [ ] Sidebar now shows **groups**: Home · Houses & Land (flat) · **Agents** · **Customers** · **Website Content** · Messages · Site Info.
- [ ] Clicking a group heading expands/collapses it; the group holding the current page auto-opens.
- [ ] **Agents** group expands to *All Staff / Add Staff / Applications* **plus a live "Their details" list** of each staff member → clicking a name opens their edit/details page.
- [ ] An **agent-role** login sees only the flat items it's allowed (Home, Houses & Land, Messages) — no admin-only groups.
- [ ] Mobile drawer mirrors the same grouped nav.
- [ ] Each agent sub-link shows a small **avatar** (photo, or initial when no photo).

### 14c. About editor extras
- [ ] Value cards use an **icon dropdown** (searchable) with a live icon preview beside it — no more typing raw icon names.
- [ ] **Preview page** button in the header opens `/about` in a new tab.
- [ ] **Search & sharing (SEO)** section: editing title/description/share-image changes the browser tab title + meta on `/about` after save.
- [ ] Replacing the banner or founder image and saving deletes the **old** file (no orphaned uploads); About images survive the periodic orphan sweep.
- [ ] Ticking **"Also show the founder on the Team page"** → founder appears as the first card on `/agents`, linking to `/about`; unticking removes it.

## 15. Team Members = admin-managed public profiles (separate from logins)

> **Behaviour change:** the public **Our Team** page (`/agents`) is now driven by the new
> **Team Members** system, NOT by login accounts. People with panel logins no longer
> auto-appear on the site — you add team profiles explicitly.

### 15a. Admin management (Our Team)
- [ ] Sidebar → **Our Team** group → **All Members** (empty at first) and **Add Member**.
- [ ] Add a member (name, title, phone/WhatsApp/email, photo, bio, order, visible) → saves; slug auto-generates from the name (or use the custom "Page link name").
- [ ] Two members with the same name → second slug becomes `…-2` (no clash).
- [ ] **Show/Hide** toggle flips whether they appear on the site; **Edit** and **Delete** work.
- [ ] Replacing a photo and saving removes the old file; deleting a member removes their photo.
- [ ] The **Our Team** nav group expands to a live **"Their details"** list of members (avatars) → click → edit.

### 15b. Public site
- [ ] `/agents` shows the visible members ordered by **Display order** then name; hidden ones don't show.
- [ ] Click a member → `/agents/:slug` shows full details (photo, title, bio, phone/email/WhatsApp).
- [ ] The founder card (if enabled in the About editor) still shows first, before the members.

### 15c. Website Access (unchanged logins)
- [ ] Sidebar → **Website Access** → **Staff Logins / Add Login / Applications** still manage who can *use* the admin panel (agent/admin accounts + the become-an-agent requests). These no longer affect the public team page.

## 16. Alert channel choice (phone / email / both) + dashboard fix

### 16a. Layout
- [ ] `/dashboard` content starts **below** the fixed navbar (no overlap), mobile and desktop.

### 16b. First-time modal
- [ ] A verified client who has **never chosen** a channel sees the "How should we let you know?" modal on the dashboard.
- [ ] Picking **By email** → saves and closes; modal never returns.
- [ ] Picking **On my phone** or **Both** → saves, then shows the "turn on alerts on this device" step (browser permission + enable).
- [ ] Closing the modal without choosing → it reappears on the next visit; meanwhile the client still gets alerts (unset = Both).

### 16c. Preferences panel
- [ ] "How we tell you about new matches" shows four cards: On my phone · By email · Both · Don't send me alerts; the saved one is highlighted.
- [ ] Choosing On my phone / Both reveals the device-enable toggle with the nudge text.
- [ ] Filters (locations / types / price / bedrooms) still save; "Leave these empty to hear about everything" hint shows.

### 16d. Delivery rules (publish a matching property; needs SMTP/VAPID on VPS)
- [ ] `channel: email` → email only, no push.
- [ ] `channel: push` (with a subscribed browser) → push only, no email.
- [ ] `channel: both` → both arrive.
- [ ] `channel: off` → nothing.
- [ ] No channel chosen yet → treated as both.
- [ ] Old account with legacy `emailAlerts: true` → still gets email (mapped to email-only).
- [ ] Empty filters still match every new listing; set filters still gate as before.

## 17. Email verification gates all features

### 17a. Unverified account (register, don't click the link)
- [ ] `/dashboard` shows ONLY the "Confirm your email to use your dashboard" screen (with Resend) — no saved/viewed/messages cards, no alert preferences, no channel modal.
- [ ] Saving a property / messaging an agent from a property page → rejected with "Please confirm your email address to use this feature."
- [ ] API-level (server rule): `/client/saved`, `/client/views`, `/client/inquiries`, `/client/notifications/subscribe`, and profile/preferences updates all return 403 for an unverified account, even with a valid token.
- [ ] Browsing stays open — home, properties, property details, agents all work signed-in-but-unverified.

### 17b. After clicking the verification link
- [ ] Dashboard unlocks: cards + alert preferences appear; the channel modal shows (first time).
- [ ] Saving, messaging, and enabling phone alerts all work again.
- [ ] Deactivated accounts (admin toggled off) are blocked the same way.

## Reminder
Email/push items require the VPS `.env`: `PUBLIC_ORIGIN=https://sureboyrealty.com`, the `SMTP_*` / `MAIL_FROM` values, and the `VAPID_*` keys — then `docker compose up -d api` and rebuild the frontend.

Test these:
Public website
Home page: are buttons clear?
Menu: do labels make sense? Houses & Land, Help We Offer, News & Tips
Properties page: can someone search/filter easily?
Property details: are actions clear? Ask About This Place, Book a Visit
Contact page: does it feel easy to send a message?
About/Services/FAQ: is the English simple enough?

Admin
Login page: clear?
Admin home: does it feel less cluttered?
Sidebar/mobile drawer: icons and labels easy to understand?
Add/Edit house or land form: can someone fill it without confusion?
Reviews, Questions, Staff, Messages: labels make sense?

Visual checks
Text must not overflow container.
Text should wrap properly.
White/green/gold contrast must be readable.
Buttons should look clickable.
Mobile view should not feel squeezed.

The main question while testing is: