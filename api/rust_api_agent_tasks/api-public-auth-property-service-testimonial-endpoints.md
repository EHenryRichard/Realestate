# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 16–20

## 16. Public API Endpoints

Public endpoints do not require admin authentication.

```txt
GET /api/health

GET /api/properties
GET /api/properties/featured
GET /api/properties/:slug

GET /api/services
GET /api/services/:slug

GET /api/testimonials

POST /api/contact
POST /api/newsletter

GET /api/settings/public
```

Public property list should only return visible properties.

Public testimonials should only return visible testimonials.

Public services should only return active services.

---

---

## 17. Admin Auth Endpoints

```txt
POST /api/admin/auth/login
GET /api/admin/auth/me
POST /api/admin/auth/logout
```

Login request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Login response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "admin": {
      "id": "uuid",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

Do not return password hashes.

---

---

## 18. Admin Property Endpoints

Protected endpoints:

```txt
GET /api/admin/properties
POST /api/admin/properties
GET /api/admin/properties/:id
PUT /api/admin/properties/:id
DELETE /api/admin/properties/:id
PATCH /api/admin/properties/:id/featured
PATCH /api/admin/properties/:id/status
```

Query support:

```txt
?page=1&limit=20&search=&status=&type=&location=&sort=newest
```

Create property request should support:

```json
{
  "title": "Luxury 4 Bedroom Duplex",
  "slug": "luxury-4-bedroom-duplex",
  "location": "Lagos, Nigeria",
  "price": 85000000,
  "currency": "NGN",
  "propertyType": "duplex",
  "status": "available",
  "bedrooms": 4,
  "bathrooms": 5,
  "area": "450 sqm",
  "mainImage": "/images/properties/example.webp",
  "imageAlt": "Luxury duplex in Lagos",
  "galleryImages": [],
  "description": "Property description here",
  "features": ["Security", "Parking", "Modern kitchen"],
  "isFeatured": true,
  "isVisible": true
}
```

---

---

## 19. Admin Service Endpoints

Protected endpoints:

```txt
GET /api/admin/services
POST /api/admin/services
GET /api/admin/services/:id
PUT /api/admin/services/:id
DELETE /api/admin/services/:id
PATCH /api/admin/services/:id/active
```

---

---

## 20. Admin Testimonial Endpoints

Protected endpoints:

```txt
GET /api/admin/testimonials
POST /api/admin/testimonials
GET /api/admin/testimonials/:id
PUT /api/admin/testimonials/:id
DELETE /api/admin/testimonials/:id
PATCH /api/admin/testimonials/:id/visible
```

---
