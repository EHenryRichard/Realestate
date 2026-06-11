# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 17–20

## 17. Newsletter Admin Requirements

Route:

```txt
/admin/newsletter
```

Admin must support:

- View subscribers
- Search subscribers
- Delete subscriber
- Export later
- Mark active/inactive later

Subscriber fields:

```txt
id
email
status
createdAt
updatedAt
```

---

---

## 18. Settings Admin Requirements

Route:

```txt
/admin/settings
```

Admin should eventually control:

- Brand name
- Tagline
- Phone number
- WhatsApp number
- Email
- Address
- Social links
- Default CTA text
- Logo path
- Favicon path
- Open Graph image

Current implementation may still read from:

```txt
src/config/siteConfig.js
```

But settings UI should be ready for backend persistence.

---

---

## 19. Admin API Service Layer

Create API files inside:

```txt
src/admin/api/
```

Each API file should use the shared Axios client where possible.

Example modules:

```txt
adminAuthApi.js
adminPropertyApi.js
adminServiceApi.js
adminTestimonialApi.js
adminMessageApi.js
adminNewsletterApi.js
adminSettingsApi.js
```

Do not place Axios logic inside pages or UI components.

Pages should call hooks.

Hooks should call admin API service files.

---

---

## 20. Admin Data Flow

Use this flow:

```txt
Admin Page
  ↓
Admin Hook
  ↓
Admin API Service
  ↓
Axios Client
  ↓
Rust Backend API
  ↓
Database
```

Temporary local data fallback is allowed while backend is incomplete.

---
