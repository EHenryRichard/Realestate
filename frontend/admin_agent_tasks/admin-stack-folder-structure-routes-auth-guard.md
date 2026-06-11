# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 5–8

## 5. Admin Stack

Use the same frontend stack:

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Bootstrap-style React SVG icons using the existing icon mapping strategy
- Local data fallback while backend is being built
- API-ready hooks and services

Avoid:

- Redux unless truly required
- Heavy UI libraries
- Heavy dashboard templates
- Full Bootstrap CSS/JS
- Repeating business data directly inside components
- Putting Axios calls directly inside UI components

---

---

## 6. Required Admin Folder Structure

Create this structure:

```txt
src/admin/
  api/
    adminAuthApi.js
    adminDashboardApi.js
    adminPropertyApi.js
    adminServiceApi.js
    adminTestimonialApi.js
    adminMessageApi.js
    adminNewsletterApi.js
    adminSettingsApi.js

  components/
    layout/
      AdminLayout.jsx
      AdminSidebar.jsx
      AdminTopbar.jsx
      AdminMobileDrawer.jsx
      AdminProtectedRoute.jsx

    dashboard/
      AdminStatGrid.jsx
      RecentProperties.jsx
      RecentMessages.jsx
      QuickActions.jsx

    forms/
      PropertyForm.jsx
      ServiceForm.jsx
      TestimonialForm.jsx
      SettingsForm.jsx

    tables/
      PropertiesTable.jsx
      ServicesTable.jsx
      TestimonialsTable.jsx
      MessagesTable.jsx
      NewsletterTable.jsx

    ui/
      AdminButton.jsx
      AdminCard.jsx
      AdminTable.jsx
      AdminModal.jsx
      AdminConfirmDialog.jsx
      AdminInput.jsx
      AdminTextarea.jsx
      AdminSelect.jsx
      AdminSearchInput.jsx
      AdminImageUploader.jsx
      AdminGalleryUploader.jsx
      AdminStatCard.jsx
      AdminBadge.jsx
      AdminPageHeader.jsx
      AdminEmptyState.jsx
      AdminErrorState.jsx
      AdminLoader.jsx
      AdminPagination.jsx

  data/
    adminNavLinks.js
    adminStatsData.js
    adminTableActions.js

  hooks/
    useAdminAuth.js
    useAdminDashboard.js
    useAdminProperties.js
    useAdminServices.js
    useAdminTestimonials.js
    useAdminMessages.js
    useAdminNewsletter.js
    useAdminSettings.js

  pages/
    Login/
      AdminLogin.jsx

    Dashboard/
      AdminDashboard.jsx

    Properties/
      AdminProperties.jsx
      CreateProperty.jsx
      EditProperty.jsx

    Services/
      AdminServices.jsx
      CreateService.jsx
      EditService.jsx

    Testimonials/
      AdminTestimonials.jsx
      CreateTestimonial.jsx
      EditTestimonial.jsx

    Messages/
      AdminMessages.jsx
      AdminMessageDetails.jsx

    Newsletter/
      AdminNewsletter.jsx

    Settings/
      AdminSettings.jsx
```

---

---

## 7. Admin Routes

Create these routes:

```txt
/admin/login
/admin
/admin/properties
/admin/properties/create
/admin/properties/:id/edit
/admin/services
/admin/services/create
/admin/services/:id/edit
/admin/testimonials
/admin/testimonials/create
/admin/testimonials/:id/edit
/admin/messages
/admin/messages/:id
/admin/newsletter
/admin/settings
```

Future routes:

```txt
/admin/users
/admin/analytics
/admin/uploads
/admin/projects
/admin/saved-houses
```

Admin routes must use lazy-loaded pages where reasonable.

---

---

## 8. Route Protection

Create:

```txt
src/admin/components/layout/AdminProtectedRoute.jsx
```

Responsibilities:

- Check if admin token/session exists
- Redirect unauthenticated users to `/admin/login`
- Show admin loader while checking auth
- Preserve intended destination where possible
- Prevent public users from accessing dashboard pages

Authentication should be API-ready.

Temporary local implementation may use:

```txt
localStorage admin token
```

But the final backend should use secure authentication behavior.

---
