# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 21–24

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
