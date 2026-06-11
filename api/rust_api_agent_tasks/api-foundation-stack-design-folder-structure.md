# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 1–5

## 1. API Mission

Build a secure, fast, maintainable Rust backend API for **Sureboy Realty**.

The API powers:

- Public website data
- Admin dashboard management
- Property listings
- Property details
- Services
- Testimonials
- Contact messages
- Newsletter subscribers
- Site settings
- Image uploads later
- Authentication and authorization

The backend must be clean, scalable, and easy to connect to the existing React/Vite frontend and future admin dashboard.

---

---

## 2. Backend Stack Decision

Use Rust for the backend.

Recommended stack:

```txt
Rust
Actix Web
SQLx with normal PostgreSQL SQL
PostgreSQL
Serde
Tokio
dotenvy
validator
jsonwebtoken or secure cookie sessions
bcrypt or argon2 for password hashing
tracing / env_logger
actix-cors
actix-multipart for uploads later
```

Preferred database:

```txt
PostgreSQL
```

Do not use SeaORM or another ORM. Use normal parameterized PostgreSQL SQL through SQLx.

Keep handler code readable: shared `PgPool` in `web::Data`, request DTOs, response models with `sqlx::FromRow`, and straightforward CRUD SQL.

---

---

## 3. API Design Style

The API should be:

- RESTful
- JSON-first
- Admin-protected where needed
- Public-read where needed
- Modular
- Secure
- Easy for the React app to consume
- Easy to test with Postman/Thunder Client

Use clear endpoint naming.

Use plural resources:

```txt
/properties
/services
/testimonials
/contact-messages
/newsletter-subscribers
/settings
```

Admin endpoints should be protected under:

```txt
/admin
```

Public endpoints should remain clean:

```txt
/api/properties
/api/services
/api/testimonials
/api/contact
/api/newsletter
```

---

---

## 4. Relationship to Frontend

The public website is a React 19 + Vite SPA.

The admin dashboard will also live inside the same frontend app under `/admin`.

The Rust backend should serve JSON data to both.

Frontend data flow:

```txt
React Page
  ↓
Hook
  ↓
Axios API Service
  ↓
Rust API
  ↓
PostgreSQL
```

The backend must match the frontend property, service, testimonial, contact, and newsletter models.

---

---

## 5. Project Folder Structure

Use this backend structure:

```txt
sureboy-realty-api/
  Cargo.toml
  .env
  .env.example
  README.md

  migrations/

  src/
    main.rs
    app.rs
    config.rs
    db.rs
    error.rs
    response.rs

    routes/
      mod.rs
      public_routes.rs
      admin_routes.rs
      auth_routes.rs
      property_routes.rs
      service_routes.rs
      testimonial_routes.rs
      contact_routes.rs
      newsletter_routes.rs
      settings_routes.rs

    handlers/
      mod.rs
      auth_handler.rs
      property_handler.rs
      service_handler.rs
      testimonial_handler.rs
      contact_handler.rs
      newsletter_handler.rs
      settings_handler.rs
      upload_handler.rs

    models/
      mod.rs
      admin_user.rs
      property.rs
      service.rs
      testimonial.rs
      contact_message.rs
      newsletter_subscriber.rs
      site_settings.rs

    dto/
      mod.rs
      auth_dto.rs
      property_dto.rs
      service_dto.rs
      testimonial_dto.rs
      contact_dto.rs
      newsletter_dto.rs
      settings_dto.rs

    repositories/
      mod.rs
      admin_user_repo.rs
      property_repo.rs
      service_repo.rs
      testimonial_repo.rs
      contact_repo.rs
      newsletter_repo.rs
      settings_repo.rs

    services/
      mod.rs
      auth_service.rs
      property_service.rs
      service_service.rs
      testimonial_service.rs
      contact_service.rs
      newsletter_service.rs
      settings_service.rs
      upload_service.rs

    middleware/
      mod.rs
      auth_middleware.rs
      error_middleware.rs

    utils/
      mod.rs
      slug.rs
      password.rs
      jwt.rs
      pagination.rs
      validation.rs
      file_upload.rs
```

---
