# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 26–30

## 26. Authentication and Security

The backend must enforce real security.

Rules:

- Hash passwords with Argon2 or bcrypt
- Never store plain passwords
- Use JWT or secure cookie session
- Protect all `/api/admin/*` endpoints except login
- Use CORS carefully
- Validate all inputs
- Use parameterized SQL through SQLx. Never concatenate untrusted user input into SQL strings.
- Never expose `.env` values
- Never return password hashes
- Use strong JWT secret
- Use HTTPS in production
- Add rate limiting later for login and contact form

Frontend route protection is not enough.

Rust backend must be the real security layer.

---

---

## 27. CORS Rules

Allow the frontend dev server during development:

```txt
http://localhost:5173
```

Production should only allow the real Sureboy Realty domain.

Do not use open wildcard CORS in production.

---

---

## 28. Image Upload Plan

First version may use image paths from frontend/public files.

Later backend should support uploads with:

```txt
POST /api/admin/uploads/image
POST /api/admin/uploads/property-gallery
DELETE /api/admin/uploads/:id
```

Use:

```txt
actix-multipart
```

Upload rules:

- Allow only image types
- Limit file size
- Generate safe filenames
- Store path in database
- Return public URL/path
- Consider cloud storage later

---

---

## 29. Pagination and Filtering

Admin list endpoints should support pagination.

Use query params:

```txt
page
limit
search
status
type
sort
```

Default:

```txt
page=1
limit=20
sort=newest
```

Never return unlimited large lists by default.

---

---

## 30. Error Handling

Create a centralized error type:

```txt
src/error.rs
```

Handle:

- Validation errors
- Not found errors
- Unauthorized errors
- Forbidden errors
- Database errors
- Conflict errors
- Internal server errors

Do not expose raw SQL/database errors to users.

Log internal errors, return clean messages.

---
