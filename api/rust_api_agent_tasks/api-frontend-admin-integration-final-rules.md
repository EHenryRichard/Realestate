# RUST_API_AGENT.md — Sureboy Realty Rust API Implementation Guide

# Part 36–39

## 36. Public Website Integration

The existing public frontend expects endpoints like:

```txt
GET /properties
GET /properties/featured
GET /properties/:slug
GET /services
GET /testimonials
POST /contact
POST /newsletter
```

Final backend can expose them as:

```txt
/api/properties
/api/properties/featured
/api/properties/:slug
/api/services
/api/testimonials
/api/contact
/api/newsletter
```

Then frontend `apiConfig.js` should set:

```txt
API_BASE_URL=http://localhost:8080/api
```

---

---

## 37. Admin Frontend Integration

Admin frontend should call:

```txt
/api/admin/auth/login
/api/admin/properties
/api/admin/services
/api/admin/testimonials
/api/admin/messages
/api/admin/newsletter
/api/admin/settings
```

Use Authorization header if JWT is used:

```txt
Authorization: Bearer <token>
```

---

---

## 38. Do Not Do These Things

Do not:

- Store plain passwords
- Trust frontend validation only
- Put all code in `main.rs`
- Use raw string SQL everywhere without organization
- Expose database errors directly
- Use wildcard CORS in production
- Make admin endpoints public
- Return hidden properties on public endpoints
- Return inactive services publicly
- Return hidden testimonials publicly
- Ignore pagination on admin list endpoints
- Skip migrations
- Hardcode production secrets
- Mix frontend code into backend project

---

---

## 39. Final Expected API Result

The completed Rust API should be:

- Fast
- Secure
- PostgreSQL-backed
- Actix Web powered
- SQLx/direct PostgreSQL SQL based
- RESTful
- Admin-protected
- Public-read ready
- Frontend-friendly
- Easy to test
- Easy to extend
- Ready for image uploads later
- Ready for deployment

Most important principle:

**The Rust API is the source of truth. The public website displays data, the admin dashboard manages data, and the backend protects and stores the data.**
