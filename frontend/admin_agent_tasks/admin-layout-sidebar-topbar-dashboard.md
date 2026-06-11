# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 9–12

## 9. Admin Layout

Create:

```txt
src/admin/components/layout/AdminLayout.jsx
```

AdminLayout must render:

```txt
AdminSidebar
AdminTopbar
Main content area
```

Desktop layout:

```txt
Fixed sidebar on left
Topbar at top of content area
Scrollable main content
```

Mobile layout:

```txt
Topbar
Hamburger menu
Mobile drawer sidebar
Scrollable content
```

The admin should not render the public Header or Footer.

---

---

## 10. Admin Sidebar

Sidebar should include:

- Sureboy Realty admin brand/wordmark
- Dashboard link
- Properties link
- Services link
- Testimonials link
- Messages link
- Newsletter link
- Settings link
- Logout button

Navigation data source:

```txt
src/admin/data/adminNavLinks.js
```

Each nav item should support:

```txt
id
label
href
iconKey
helper optional
```

Use icons through the existing icon mapping system.

Active route should show:

- Gold marker
- Slight emerald/gold contrast
- Strong but clean visual state

---

---

## 11. Admin Topbar

Topbar should include:

- Page title
- Current admin name or role
- Search action where useful
- Add Property quick action
- Mobile menu button
- Logout or account action

Use:

```txt
border-b border-brand-gold/50
```

where a gold separator is desired.

---

---

## 12. Admin Dashboard Page

Route:

```txt
/admin
```

The dashboard should show:

- Total properties
- Featured properties
- Available properties
- Sold properties
- Total services
- Total testimonials
- Unread messages
- Newsletter subscribers

Also include:

- Recent properties table/list
- Recent messages list
- Quick actions

Quick actions:

```txt
Add Property
Add Service
Add Testimonial
View Messages
Edit Site Settings
```

Do not hardcode dashboard stats in JSX. Use a hook:

```txt
useAdminDashboard.js
```

The hook can use local fallback data first, then API later.

---
