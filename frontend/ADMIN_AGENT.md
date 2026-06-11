# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

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

Authentication uses the Rust API in production mode. Admin access tokens are kept only in React Context memory and mirrored into the in-memory Axios token bridge; they must not be stored in `localStorage` or `sessionStorage`. Refresh tokens are set by the API as HttpOnly cookies and restored through `/api/admin/auth/refresh`.

---

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

## 13. Property Admin Requirements

Property management is the most important admin module.

Routes:

```txt
/admin/properties
/admin/properties/create
/admin/properties/:id/edit
```

The admin must support:

- View all properties
- Search properties
- Filter by property type
- Filter by status
- Filter by location
- Sort by newest/oldest/price
- Add property
- Edit property
- Delete property
- Mark property as featured
- Change property status
- Upload main image
- Upload gallery images

### Property Fields

Use this model:

```txt
id
title
slug
location
price
currency
type
status
bedrooms
bathrooms
area
mainImage
imageAlt
galleryImages
description
features
isFeatured
createdAt
updatedAt
```

### Property Status Values

Use clean values such as:

```txt
available
sold
rented
pending
hidden
```

### Property Type Values

Use values such as:

```txt
house
apartment
duplex
land
commercial
shortlet
estate
```

Do not make property data only visual. It must match the public website model and future API model.

---

## 14. Service Admin Requirements

Routes:

```txt
/admin/services
/admin/services/create
/admin/services/:id/edit
```

Admin must support:

- Add service
- Edit service
- Delete service
- Hide/show service
- Reorder later if needed

Service fields:

```txt
id
title
slug
shortDescription
fullDescription
iconKey
image
features
ctaText
link
isActive
createdAt
updatedAt
```

Core services:

- Property Sales
- Property Management
- Real Estate Consultancy
- Property Inspection
- Investment Advisory
- Land and Housing Solutions

---

## 15. Testimonial Admin Requirements

Routes:

```txt
/admin/testimonials
/admin/testimonials/create
/admin/testimonials/:id/edit
```

Admin must support:

- Add testimonial
- Edit testimonial
- Delete testimonial
- Hide/show testimonial
- Upload avatar optional

Testimonial fields:

```txt
id
clientName
clientRole
serviceUsed
rating
quote
avatar
isVisible
createdAt
updatedAt
```

Use default avatar fallback if avatar is missing.

---

## 16. Message Admin Requirements

Routes:

```txt
/admin/messages
/admin/messages/:id
```

Messages come from the public contact form.

Admin must support:

- View messages
- Search messages
- Filter by unread/read/replied
- View full message
- Mark as read
- Mark as replied
- Delete message
- Copy email
- Copy phone number
- Open WhatsApp link if phone is available

Message fields:

```txt
id
fullName
email
phone
serviceInterestedIn
message
status
createdAt
updatedAt
```

Status values:

```txt
unread
read
replied
archived
```

---

## 17. Newsletter Admin Requirements

Route:

```txt
/admin/newsletter
```

Admin must support:

- View subscribers
- Search subscribers
- Delete subscriber
- Export later
- Mark active/inactive later

Subscriber fields:

```txt
id
email
status
createdAt
updatedAt
```

---

## 18. Settings Admin Requirements

Route:

```txt
/admin/settings
```

Admin should eventually control:

- Brand name
- Tagline
- Phone number
- WhatsApp number
- Email
- Address
- Social links
- Default CTA text
- Logo path
- Favicon path
- Open Graph image

Current implementation may still read from:

```txt
src/config/siteConfig.js
```

But settings UI should be ready for backend persistence.

---

## 19. Admin API Service Layer

Create API files inside:

```txt
src/admin/api/
```

Each API file should use the shared Axios client where possible.

Example modules:

```txt
adminAuthApi.js
adminPropertyApi.js
adminServiceApi.js
adminTestimonialApi.js
adminMessageApi.js
adminNewsletterApi.js
adminSettingsApi.js
```

Do not place Axios logic inside pages or UI components.

Pages should call hooks.

Hooks should call admin API service files.

---

## 20. Admin Data Flow

Use this flow:

```txt
Admin Page
  ↓
Admin Hook
  ↓
Admin API Service
  ↓
Axios Client
  ↓
Rust Backend API
  ↓
Database
```

Temporary local data fallback is allowed while backend is incomplete.

---

## 21. Admin Forms

Admin forms must support:

- Validation
- Loading state
- Error state
- Success state
- Disabled submit while submitting
- Image preview for uploads
- Clear field labels
- Backend-ready payloads

Do not create forms as purely visual designs.

Property form should be reusable between create and edit pages.

Create:

```txt
src/admin/components/forms/PropertyForm.jsx
```

Then reuse it in:

```txt
CreateProperty.jsx
EditProperty.jsx
```

---

## 22. Admin Tables

Admin tables must support:

- Empty states
- Loading states
- Error states
- Search
- Filters where relevant
- Actions column
- Edit action
- Delete action
- Status badges
- Responsive mobile handling

Do not make tables unreadable on mobile. On mobile, tables may become stacked cards.

---

## 23. Image Upload UX

Create:

```txt
AdminImageUploader.jsx
AdminGalleryUploader.jsx
```

The uploader should support:

- Preview image
- Remove image
- Replace image
- Accept image files
- Show upload loading state later
- Use API-ready image paths

For the first frontend version, it may store image paths or preview files only.

The backend will later handle real uploads.

---

## 24. Accessibility

Admin must be accessible:

- Proper labels on form fields
- Keyboard navigable sidebar
- Focus management in modals
- Escape closes modal/drawer
- Buttons must have real button elements
- Icons should use `aria-hidden` when decorative
- Destructive actions require confirmation
- Mobile drawer must be keyboard accessible

---

## 25. Performance Rules

- Lazy-load admin pages
- Do not load admin pages on public route unless needed
- Keep dashboard components small
- Avoid unnecessary libraries
- Avoid global state unless truly needed
- Use hooks to isolate data logic
- Use skeleton/loading states for tables and cards

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

## 29. Final Expected Admin Result

The completed admin should be:

- Private
- Protected
- Fast
- Premium-looking
- Mobile responsive
- API-ready
- Data-driven
- Form-validating
- Image-upload-ready
- Backend-ready
- Consistent with Sureboy Realty branding
- Separate from the public website architecture

Most important principle:

**The admin controls the public website data, but its UI and logic must remain cleanly separated from the public website UI.**

---

## 30. Implemented Admin Start

The first admin scaffold has been created under `src/admin/` and should be preserved:

- `/admin/login` and `/admin/signup` use the Rust auth API. Access tokens live only in admin React Context memory, and the refresh token is handled through the HttpOnly `sureboy_refresh_token` cookie.
- `/admin/*` routes are separate from the public `PageLayout`, so public Header/Footer do not render inside admin.
- `AdminProtectedRoute`, `AdminLayout`, `AdminSidebar`, `AdminTopbar`, and `AdminMobileDrawer` are in place.
- Dashboard, property, service, testimonial, message, newsletter, and settings pages are routed and lazy-loaded.
- Reusable admin UI components, form components, table components, local fallback data, hooks, and API service modules are in place.
- Admin forms connect to the Rust API in API mode. Property, service, testimonial, and settings forms submit backend-ready payloads, while image/video uploaders use the admin upload endpoints.
- Admin API list responses include pagination metadata and support search/filter query params. UI list work should preserve `page`, `limit`, `search`, and endpoint-specific filters instead of refetching everything.
- The Rust API removes old uploaded media from disk when records are updated/deleted and no database reference remains. Admin upload UI can also call `DELETE /api/admin/uploads` with `path` or `paths` to clean loose unused uploads.
- Admin-vs-agent permissions are enforced by the API. Admin users can manage all admin resources; agents are limited to properties, uploads, messages, and read-only dashboard/session access.
