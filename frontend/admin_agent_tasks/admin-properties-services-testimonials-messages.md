# ADMIN_AGENT.md — Sureboy Realty Admin Dashboard Implementation Guide

# Part 13–16

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
