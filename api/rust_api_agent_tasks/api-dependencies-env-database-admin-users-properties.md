# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 6–10

## 6. Cargo Dependencies

Use dependencies similar to this:

```toml
[dependencies]
actix-web = "4"
actix-cors = "0.7"
actix-multipart = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "json", "macros"] }
uuid = { version = "1", features = ["serde", "v4"] }
chrono = { version = "0.4", features = ["serde"] }
dotenvy = "0.15"
validator = { version = "0.20", features = ["derive"] }
jsonwebtoken = "9"
argon2 = "0.5"
thiserror = "2"
tracing = "0.1"
tracing-subscriber = "0.3"
```

If using `env_logger` instead of tracing, keep logging simple at first.

---

---

## 7. Environment Variables

Create `.env.example`:

```txt
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
DATABASE_URL=postgres://postgres:password@localhost:5432/sureboy_realty
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@sureboyrealty.com
ADMIN_PASSWORD=change_this_password
UPLOAD_DIR=uploads
```

Never commit real secrets.

---

---

## 8. Database Tables

Use PostgreSQL migrations.

Required tables:

```txt
admin_users
properties
property_gallery_images
services
testimonials
contact_messages
newsletter_subscribers
site_settings
```

Future tables:

```txt
property_features
property_inquiries
projects
saved_houses
uploads
audit_logs
```

---

---

## 9. Admin Users Table

Table: `admin_users`

Fields:

```txt
id UUID primary key
full_name TEXT not null
email TEXT unique not null
password_hash TEXT not null
role TEXT not null default 'admin'
is_active BOOLEAN not null default true
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Roles later:

```txt
super_admin
admin
editor
viewer
```

First version can use one admin role.

---

---

## 10. Properties Table

Table: `properties`

Fields:

```txt
id UUID primary key
title TEXT not null
slug TEXT unique not null
location TEXT not null
price NUMERIC not null
currency TEXT not null default 'NGN'
property_type TEXT not null
status TEXT not null default 'available'
bedrooms INTEGER
bathrooms INTEGER
area TEXT
main_image TEXT
image_alt TEXT
description TEXT not null
features JSONB not null default '[]'
is_featured BOOLEAN not null default false
is_visible BOOLEAN not null default true
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Table: `property_gallery_images`

```txt
id UUID primary key
property_id UUID references properties(id) on delete cascade
image_url TEXT not null
image_alt TEXT
sort_order INTEGER not null default 0
created_at TIMESTAMPTZ not null default now()
```

Property statuses:

```txt
available
sold
rented
pending
hidden
```

Property types:

```txt
house
apartment
duplex
land
commercial
shortlet
estate
```

---
