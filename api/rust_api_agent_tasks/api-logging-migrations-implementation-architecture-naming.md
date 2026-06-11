# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 31–35

## 31. Logging

Use logging for:

- Server startup
- Database connection
- Failed logins
- API errors
- Important admin actions later

Prefer:

```txt
tracing
tracing-subscriber
```

Simple `env_logger` is acceptable for first learning version.

---

---

## 32. Migration Order

Create migrations in this order:

1. admin_users
2. properties
3. property_gallery_images
4. services
5. testimonials
6. contact_messages
7. newsletter_subscribers
8. site_settings

Seed first admin user safely.

Do not keep plain default admin password in production.

---

---

## 33. Implementation Order

Build the Rust API in this order:

1. Create Rust Actix Web project
2. Add dependencies
3. Create `.env` and config loader
4. Connect PostgreSQL with SQLx `PgPool`
5. Add health endpoint
6. Create standard response format
7. Create error handling
8. Create database migrations
9. Create admin user table
10. Build auth login
11. Build auth middleware
12. Build property model/repository/service/handler/routes
13. Build public property endpoints
14. Build admin property endpoints
15. Build services endpoints
16. Build testimonials endpoints
17. Build contact form endpoint
18. Build newsletter endpoint
19. Build settings endpoint
20. Add pagination/filtering
21. Add image upload later
22. Connect frontend admin dashboard

---

---

## 34. Rust Code Architecture Rule

Use this flow:

```txt
Route
  ↓
Handler
  ↓
Service
  ↓
Repository
  ↓
Database
```

Do not put database SQL directly inside route definitions.

Do not put business rules directly inside repositories.

Do not make `main.rs` too large.

`main.rs` should mostly start the server and call app configuration.

---

---

## 35. Naming Convention

Use Rust snake_case internally:

```txt
property_type
main_image
is_featured
created_at
```

Use camelCase in JSON responses where frontend expects it:

```txt
propertyType
mainImage
isFeatured
createdAt
```

Serde can help rename fields:

```rust
#[serde(rename_all = "camelCase")]
```

---
