# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 21–25

## 21. Admin Message Endpoints

Protected endpoints:

```txt
GET /api/admin/messages
GET /api/admin/messages/:id
PATCH /api/admin/messages/:id/read
PATCH /api/admin/messages/:id/status
DELETE /api/admin/messages/:id
```

---

---

## 22. Admin Newsletter Endpoints

Protected endpoints:

```txt
GET /api/admin/newsletter
DELETE /api/admin/newsletter/:id
PATCH /api/admin/newsletter/:id/status
```

---

---

## 23. Admin Settings Endpoints

Protected endpoints:

```txt
GET /api/admin/settings
PUT /api/admin/settings
```

Public settings endpoint:

```txt
GET /api/settings/public
```

Public settings should only expose safe public fields.

---

---

## 24. Standard API Response Format

Use consistent responses.

Success response:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

List response:

```json
{
  "success": true,
  "message": "Properties fetched successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

---

## 25. Validation Rules

Validate all incoming data.

Use DTO structs for requests.

Examples:

- Email must be valid
- Password must not be empty
- Price must be positive
- Rating must be 1 to 5
- Slug must be URL-safe
- Required fields must not be empty
- Status values must be controlled
- Property type values must be controlled

Never trust frontend validation only.

---
