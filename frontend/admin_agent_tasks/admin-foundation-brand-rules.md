# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 1–4

## 1. Admin Mission

Build a private, premium, secure, data-driven admin dashboard for **Sureboy Realty**.

The admin dashboard exists to manage the content and business data shown on the public Sureboy Realty website.

The admin must support:

- Property management
- Service management
- Testimonial management
- Contact message management
- Newsletter subscriber management
- Site settings management
- Future project/saved listing management
- Future analytics and user management

The admin should be fast, clean, professional, scalable, and API-ready.

---

---

## 2. Relationship to the Public Website

The public website is already a React 19 + Vite SPA with a data-driven, API-ready architecture.

The admin dashboard must not break or pollute the public website architecture.

Use the same project, but keep the admin isolated under:

```txt
src/admin/
```

The admin must have its own:

- Layout
- Sidebar
- Topbar
- Pages
- Hooks
- API service files
- Form components
- Table components
- Protected routes
- Dashboard components

Shared files may be reused only when they make sense:

```txt
src/config/siteConfig.js
src/config/brandConfig.js
src/config/iconConfig.js
src/utils/slugify.js
src/utils/formatCurrency.js
src/utils/getImageUrl.js
src/api/axiosClient.js
```

Do not mix public page sections with admin dashboard pages.

---

---

## 3. Brand and Color Rules

Use the current Sureboy Realty visual direction.

### Main Brand Colors

Use these existing project colors and direction:

```txt
Forest green / navbar after-hero color: #063f2ca1
Dark emerald / brand emerald: deep emerald green
Gold / brand gold: mustard-gold accent
White: #ffffff
Cream/off-white: warm background sections
Soft gray: dashboard background and borders
Charcoal: serious text color where needed
```

### Color Usage

Dark emerald/forest green should dominate the admin navigation and key action areas.

Gold should be used as an accent only:

- Active nav markers
- Important stats
- Table highlights
- Button hover accents
- Status badges
- Small decorative borders

Do not make gold the dominant admin color.

### Tailwind Color Naming

Use the existing project color tokens where available:

```txt
brand-emerald
brand-gold
brand-forest
brand-cream
brand-charcoal
```

If the navbar/header needs the current translucent green, use:

```txt
bg-[#063f2ca1]
```

### Border Rule

The admin may use subtle gold borders when needed:

```txt
border-b border-brand-gold/50
```

Use it mainly for:

- Admin topbar separator
- Active section headers
- Important cards

Do not overuse gold borders.

---

---

## 4. Styling Rules

Use Tailwind CSS for the admin dashboard.

Use small custom CSS only for:

- Loader animations
- Sidebar scrollbar hiding
- Custom dropdown behavior
- Special emerald/gold dashboard effects

Follow the current project rule:

- Prefer square/no-radius styling.
- Do not use `rounded-*` utilities unless explicitly requested.
- Green buttons must use white text.
- Gold/default buttons and button-like icon links should hover to emerald green with white text.
- Shared input, textarea, select, and newsletter fields should not show visible focus outlines or focus rings.

Admin fields should look premium and clean, not default browser-styled.

---
