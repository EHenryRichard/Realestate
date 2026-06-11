# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 11–15

## 11. Services Table

Table: `services`

Fields:

```txt
id UUID primary key
title TEXT not null
slug TEXT unique not null
short_description TEXT not null
full_description TEXT not null
icon_key TEXT
image TEXT
features JSONB not null default '[]'
cta_text TEXT
link TEXT
is_active BOOLEAN not null default true
sort_order INTEGER not null default 0
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Core service examples:

- Property Sales
- Property Management
- Real Estate Consultancy
- Property Inspection
- Investment Advisory
- Land and Housing Solutions

---

---

## 12. Testimonials Table

Table: `testimonials`

Fields:

```txt
id UUID primary key
client_name TEXT not null
client_role TEXT
service_used TEXT
rating INTEGER not null default 5
quote TEXT not null
avatar TEXT
is_visible BOOLEAN not null default true
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Rating should be between 1 and 5.

---

---

## 13. Contact Messages Table

Table: `contact_messages`

Fields:

```txt
id UUID primary key
full_name TEXT not null
email TEXT not null
phone TEXT
service_interested_in TEXT
message TEXT not null
status TEXT not null default 'unread'
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Status values:

```txt
unread
read
replied
archived
```

---

---

## 14. Newsletter Subscribers Table

Table: `newsletter_subscribers`

Fields:

```txt
id UUID primary key
email TEXT unique not null
status TEXT not null default 'active'
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Status values:

```txt
active
unsubscribed
blocked
```

---

---

## 15. Site Settings Table

Table: `site_settings`

Fields:

```txt
id UUID primary key
brand_name TEXT not null
phone TEXT
whatsapp TEXT
email TEXT
address TEXT
tagline TEXT
facebook_url TEXT
instagram_url TEXT
linkedin_url TEXT
twitter_url TEXT
logo_url TEXT
favicon_url TEXT
og_image_url TEXT
created_at TIMESTAMPTZ not null default now()
updated_at TIMESTAMPTZ not null default now()
```

Default brand values:

```txt
Brand Name: Sureboy Realty
Tagline: Premium Properties. Prime Investments. Promises Delivered.
Phone: +234 916 326 7765
Email: austineokolie57@gmail.com
```

---
