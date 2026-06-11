# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 25–28

## 25. Performance Rules

- Lazy-load admin pages
- Do not load admin pages on public route unless needed
- Keep dashboard components small
- Avoid unnecessary libraries
- Avoid global state unless truly needed
- Use hooks to isolate data logic
- Use skeleton/loading states for tables and cards

---

---

## 26. Security UI Rules

The frontend is not the real security layer, but it must support secure backend behavior.

Admin should:

- Store token only temporarily if backend uses token auth
- Remove token on logout
- Redirect to login after unauthorized API response
- Never expose secret keys in frontend code
- Never hardcode admin password in production
- Never trust frontend-only route protection as final security

The Rust backend must enforce real auth and authorization.

---

---

## 27. First Implementation Order

Build admin in this order:

1. Create admin folder structure
2. Create admin nav data
3. Create admin route entries
4. Create AdminProtectedRoute
5. Create AdminLayout
6. Create AdminSidebar
7. Create AdminTopbar
8. Create AdminLogin page
9. Create AdminDashboard page
10. Create reusable Admin UI components
11. Create AdminProperties page
12. Create PropertyForm
13. Create CreateProperty page
14. Create EditProperty page
15. Create service admin pages
16. Create testimonial admin pages
17. Create message admin pages
18. Create newsletter admin page
19. Create settings admin page
20. Connect local fallback data
21. Connect API service files later

---

---

## 28. Do Not Do These Things

Do not:

- Use public Header/Footer inside admin
- Hardcode repeated admin data in JSX
- Put API requests directly inside components
- Put admin pages inside public `pages/`
- Mix admin sidebar with public navbar
- Build forms that are only decorative
- Ignore loading/error/empty states
- Ignore delete confirmations
- Ignore auth protection
- Ignore mobile admin usability
- Use inconsistent colors
- Overuse gold
- Use heavy dashboard UI libraries

---
