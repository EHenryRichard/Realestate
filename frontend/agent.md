# AGENT.md — Sureboy Realty React SPA Implementation Guide

## 1. Project Mission

Build a premium, optimized, data-driven, API-ready real estate website for **Sureboy Realty**.

The website must be a **React 19 Single Page Application** built with **Vite**, using **React Router**, **Axios**, **Tailwind CSS**, and small custom CSS only where Tailwind is not ideal.

The project must be professional, scalable, maintainable, and ready for future backend/API integration.

---

## 2. Brand Identity

### Brand Name
Sureboy Realty

### Main Tagline
Premium Properties. Prime Investments. Promises Delivered.

### Supporting Slogans
- Your Property. Our Priority.
- Built on Trust. Driven by Excellence.

### Brand Personality
The website should feel:
- Premium
- Trustworthy
- Elegant
- Professional
- Modern
- Real estate focused
- Investment focused
- Clean
- Corporate
- Luxury without being overdesigned

### Color Direction
Use the brand flyer as the visual reference.

Main palette:
- Deep forest green
- Dark emerald green
- Gold / mustard yellow
- White
- Cream / off-white
- Charcoal black
- Soft gray

Gold must be used as an accent, not the dominant color. Dark green is the dominant brand color.

---

## 3. Final Stack Decision

Use this stack:

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Bootstrap Icons style using individually imported SVG React icon components
- Small custom CSS for special effects
- SPA architecture
- Local data first
- API-ready architecture

Do not use unnecessary libraries.

Avoid:
- Heavy UI libraries
- Heavy animation libraries
- Redux unless truly needed
- Hardcoded repeated content inside components
- Scattered styling systems
- Full Bootstrap CSS/JS framework unless explicitly requested
- Icon font loading for the full icon library when individual SVG imports are enough
- Components that mix UI, data, content, and API logic

---

## 4. Application Type

This project is a **Single Page Application**.

The app should load once, then React Router should switch pages internally.

Routes:

- `/` — Home
- `/about` — About
- `/services` — Services
- `/properties` — Properties / Listings
- `/properties/:slug` — Property Details
- `/contact` — Contact
- `*` — Not Found

The route system should support lazy-loaded pages where reasonable.

---

## 5. Core Architecture Rule

The project must be:

- Component-based
- Data-driven
- Content-separated
- API-ready
- Performance-conscious
- SEO-conscious
- Accessible
- Responsive

The most important rule:

**Do not hardcode writeups, services, property data, testimonials, nav links, footer links, contact details, or repeated card content directly inside components.**

Use this separation:

- `components` = UI structure only
- `data` = temporary local arrays and objects
- `content` = long writeups and section text
- `config` = brand, contact, default images, and API settings
- `api` = Axios client and endpoint service files
- `hooks` = reusable data fetching and data connection logic
- `utils` = reusable helper functions
- `public/images` = data/API-addressable images
- `src/assets` = imported UI assets such as icons and decorative SVGs

---

## 6. Required Folder Structure

Create and follow this structure:

```txt
public/
  images/
    defaults/
    properties/
    hero/
    about/
    services/
    testimonials/
    backgrounds/
    logo/
  favicon.png
  og-image.jpg

src/
  api/
    axiosClient.js
    propertyApi.js
    serviceApi.js
    testimonialApi.js
    contactApi.js
    newsletterApi.js

  assets/
    icons/
    patterns/
    decorative/

  components/
    layout/
      Header/
        Header.jsx
        DesktopNav.jsx
        MobileNav.jsx
        MobileDrawer.jsx
      Footer/
        Footer.jsx
      PageLayout/
        PageLayout.jsx

    sections/
      Hero/
        Hero.jsx
      TrustIndicators/
        TrustIndicators.jsx
      AboutPreview/
        AboutPreview.jsx
      ServicesSection/
        ServicesSection.jsx
      FeaturedProperties/
        FeaturedProperties.jsx
      WhyChooseUs/
        WhyChooseUs.jsx
      PropertyManagementHighlight/
        PropertyManagementHighlight.jsx
      ConsultancyHighlight/
        ConsultancyHighlight.jsx
      Testimonials/
        Testimonials.jsx
      ContactCTA/
        ContactCTA.jsx
      ContactFormSection/
        ContactFormSection.jsx

    ui/
      Button/
        Button.jsx
      Container/
        Container.jsx
      SectionHeader/
        SectionHeader.jsx
      ServiceCard/
        ServiceCard.jsx
      PropertyCard/
        PropertyCard.jsx
      TestimonialCard/
        TestimonialCard.jsx
      Badge/
        Badge.jsx
      Input/
        Input.jsx
      Select/
        Select.jsx
      Textarea/
        Textarea.jsx
      AppLoader/
        AppLoader.jsx
      PageLoader/
        PageLoader.jsx
      SectionLoader/
        SectionLoader.jsx
      SkeletonCard/
        SkeletonCard.jsx
      LoadingState/
        LoadingState.jsx
      ErrorState/
        ErrorState.jsx
      EmptyState/
        EmptyState.jsx

  config/
    siteConfig.js
    brandConfig.js
    apiConfig.js
    defaultImages.js
    iconConfig.js

  content/
    homeContent.js
    aboutContent.js
    servicesContent.js
    propertiesContent.js
    contactContent.js
    seoContent.js

  data/
    navLinks.js
    servicesData.js
    propertiesData.js
    testimonialsData.js
    trustIndicatorsData.js
    whyChooseUsData.js
    footerLinks.js

  hooks/
    useProperties.js
    useServices.js
    useTestimonials.js
    useContactForm.js
    useNewsletter.js

  pages/
    Home/
      Home.jsx
    About/
      About.jsx
    Services/
      Services.jsx
    Properties/
      Properties.jsx
    PropertyDetails/
      PropertyDetails.jsx
    Contact/
      Contact.jsx
    NotFound/
      NotFound.jsx

  routes/
    AppRoutes.jsx

  styles/
    variables.css
    global.css
    utilities.css

  utils/
    formatCurrency.js
    filterProperties.js
    slugify.js
    getImageUrl.js
    getFallbackImage.js
    getWhatsAppLink.js
    formatPhoneNumber.js

  App.jsx
  main.jsx
```

Do not create a `Utils` page. `utils` is a helper folder, not a route/page.

---

## 7. Image Architecture

Use both `public` and `src/assets`, but for different jobs.

### Put these in `public/images`
Use `public/images` for images that are referenced by local data or future API data.

Examples:
- Property images
- Default fallback images
- Hero background images
- About section images
- Service images
- Testimonial avatars
- Logo files
- Open Graph images

Reason: these images can be referenced by simple URL paths such as:

- `/images/properties/luxury-duplex.webp`
- `/images/defaults/property-default.webp`
- `/images/hero/home-hero.webp`

### Put these in `src/assets`
Use `src/assets` for imported UI assets.

Examples:
- SVG icons
- Decorative shapes
- Pattern SVGs
- Small UI illustration assets
- Component-specific visual assets

### Required Default Images
Prepare fallback images for:

- default property image
- default hero image
- default avatar image
- default service image
- default gallery image
- default blog image
- logo fallback

Default images must be registered in `src/config/defaultImages.js`.

Image utilities must exist in:

- `src/utils/getImageUrl.js`
- `src/utils/getFallbackImage.js`

The image system should handle:

- Full image URLs from API
- Relative image paths
- Empty image values
- Missing images
- Default fallbacks

---

## 8. Styling Decision

Use **Tailwind CSS** for most styling.

Use Tailwind for:
- Layout
- Spacing
- Grid systems
- Cards
- Buttons
- Forms
- Responsive design
- Typography utilities
- Standard hover states

Use small custom CSS only for:
- Custom loader animations
- Special green/gold brand effects
- Complex hero overlays
- Decorative diagonal shapes inspired by the flyer
- Unique background patterns

Preferred ratio:

- Tailwind CSS: 85%
- Custom CSS: 15%

Do not mix too many styling approaches.

---

## 9. Icon System Architecture

Use **Bootstrap Icons visual style** for the website icons because the project owner prefers that icon direction.

Do **not** use the full Bootstrap framework for layout/styling. The site styling remains Tailwind CSS plus small custom CSS. Bootstrap is only for icon style.

### Preferred Implementation
Use individually imported SVG React icon components from a Bootstrap Icons-compatible package.

Preferred package direction:

- `react-bootstrap-icons` for individual SVG React icon imports

Acceptable alternative:

- `react-icons/bs` if the implementation environment prefers React Icons

Avoid:

- Importing all icons globally
- Loading the full Bootstrap CSS framework just for icons
- Using Bootstrap JS
- Using icon fonts when SVG components are available

### Icon Usage Rules
Icons must be used consistently across:

- Navbar links on mobile
- Service cards
- Trust indicators
- Why Choose Us cards
- Property feature labels
- Contact details
- Footer/social links
- Form feedback states
- Loader accents if needed

### Icon Data Strategy
Do not hardcode icon components directly inside data returned from the API.

Local data can store an icon key such as:

- `home`
- `building`
- `houseDoor`
- `geoAlt`
- `telephone`
- `envelope`
- `whatsapp`
- `cashStack`
- `shieldCheck`
- `stars`

Then resolve the icon key through an icon mapping layer in the frontend.

Recommended file:

- `src/config/iconConfig.js`

The icon configuration should map icon keys to imported Bootstrap-style SVG components.

### Icon Styling Rules
Icons should match the Sureboy Realty brand:

- Gold for primary icon accents
- Dark green for icons on light backgrounds
- White or gold icons on dark green backgrounds
- No cartoonish emoji icons in the final production UI
- Use simple, premium outline-style icons
- Keep icon sizing consistent
- Use accessible labels only where icons communicate meaning
- Use `aria-hidden` for decorative icons

### Default Icon Fallback
Create a default icon fallback for missing or unknown icon keys.

Example fallback concept:

- Unknown service icon → generic building/house icon
- Unknown contact icon → info-circle icon
- Unknown property feature icon → check-circle icon

---

## 10. Navbar and Mobile Navigation Architecture

The Header must be fully responsive and must include a polished mobile navigation system.

### Desktop Header
Desktop layout should include:

- Logo on the left
- Main navigation links in the center or right
- Phone number visible
- CTA button visible
- Active route styling
- Gold hover states
- Sticky behavior
- Subtle shadow or border on scroll

Desktop navigation links:

- Home
- About
- Services
- Properties
- Contact

CTA button:

- Speak With an Agent

### Tablet Header
Tablet layout should simplify the header:

- Logo stays visible
- CTA may remain visible if space allows
- Phone number can be hidden
- Hamburger menu appears earlier if the nav becomes crowded

### Mobile Header
Mobile layout should include:

- Logo on the left
- Hamburger button on the right
- No crowded desktop links
- No long phone number in the top bar unless space allows
- Header remains sticky
- Menu button uses a Bootstrap-style icon

### Mobile Menu Pattern
Use a premium off-canvas drawer or full-screen overlay.

Preferred direction:

- Slide-in drawer from the right
- Dark green background
- White navigation text
- Gold active/hover state
- Close button at the top
- Logo or brand name inside drawer
- Nav links with Bootstrap-style icons
- CTA button inside drawer
- Phone, WhatsApp, and email quick actions inside drawer

Mobile drawer should include:

- Home
- About
- Services
- Properties
- Contact
- Speak With an Agent
- Call Now
- WhatsApp

### Mobile Navigation Behavior
The mobile drawer must:

- Open when hamburger button is clicked
- Close when close button is clicked
- Close when overlay is clicked
- Close when a nav link is clicked
- Close when route changes
- Close on Escape key
- Prevent body scroll while open
- Return focus properly after closing
- Use `aria-expanded`, `aria-controls`, and `aria-label`
- Be keyboard accessible

### Header Component Breakdown
The Header folder should be structured as:

- `Header.jsx` — controls header state and layout
- `DesktopNav.jsx` — desktop navigation links
- `MobileNav.jsx` — hamburger button and mobile trigger area
- `MobileDrawer.jsx` — mobile off-canvas menu

The Header component should get data from:

- `src/data/navLinks.js`
- `src/config/siteConfig.js`
- `src/config/iconConfig.js`

### Navbar Data Requirements
Navigation link data should support:

- `id`
- `label`
- `href`
- `iconKey`
- `isPrimary` if needed

This allows the mobile menu to display Bootstrap-style icons beside links without hardcoding each icon inside the component.

---

## 11. Page Loader Architecture

The app must include custom loaders.

### Loader Types

1. Initial App Loader  
   Shown when the SPA first loads.

2. Route/Page Loader  
   Shown during lazy route/page transitions.

3. Section Loader  
   Shown when part of a page is loading API data.

4. Skeleton Loader  
   Used for property cards and listing grids.

5. Form Submit Loader  
   Used when submitting contact/newsletter forms.

### Loader Visual Style

The loader should match the Sureboy Realty brand:

- Dark green background
- Gold animated line/ring
- Sureboy Realty logo or name
- Smooth fade-in/fade-out
- Premium, minimal, not childish

Do not use heavy animation libraries. Use CSS/Tailwind animations.

---

## 12. Components Architecture

### Layout Components

#### Header
Responsibilities:
- Logo
- Desktop navigation
- Mobile navigation drawer
- Phone number on desktop
- CTA button
- Hamburger menu on mobile
- Close button in mobile drawer
- Active route styling
- Sticky behavior
- Accessible navigation
- Bootstrap-style icons in mobile nav and quick actions

Data source:
- `navLinks.js`
- `siteConfig.js`
- `iconConfig.js`

#### Footer
Responsibilities:
- Brand summary
- Quick links
- Service links
- Contact information
- Newsletter area
- Social links
- Copyright

Data source:
- `footerLinks.js`
- `siteConfig.js`

#### PageLayout
Responsibilities:
- Wrap pages with Header and Footer
- Keep route content consistent

---

### Section Components

#### Hero
Responsibilities:
- Main headline
- Subtitle
- CTA buttons
- Brand hero image/background
- Gold/green visual direction

Data source:
- `homeContent.js`
- `siteConfig.js`
- default hero image if hero image is missing

#### TrustIndicators
Responsibilities:
- Show trust indicators such as:
  - Trusted Service
  - Proven Excellence
  - Client Satisfaction
  - Value Assurance

Data source:
- `trustIndicatorsData.js`

#### AboutPreview
Responsibilities:
- Introduce Sureboy Realty
- Show short company message
- Display CTA to About page

Data source:
- `homeContent.js`

#### ServicesSection
Responsibilities:
- Display services as cards
- Use reusable ServiceCard

Data source:
- `servicesData.js` now
- `serviceApi.js` later
- `useServices.js` when API-ready data fetching is enabled

#### FeaturedProperties
Responsibilities:
- Display selected property cards
- Use reusable PropertyCard
- Show loading/error/empty states

Data source:
- `propertiesData.js` now
- `propertyApi.js` later
- `useProperties.js`

#### WhyChooseUs
Responsibilities:
- Show reasons to trust Sureboy Realty

Data source:
- `whyChooseUsData.js`
- `homeContent.js`

#### PropertyManagementHighlight
Responsibilities:
- Highlight property management as a serious service
- Explain landlord/property-owner benefit

Data source:
- `homeContent.js`
- `servicesContent.js`

#### ConsultancyHighlight
Responsibilities:
- Highlight real estate consultancy and investment guidance

Data source:
- `homeContent.js`
- `servicesContent.js`

#### Testimonials
Responsibilities:
- Display testimonials using TestimonialCard
- Show loading/error/empty states when API data is used

Data source:
- `testimonialsData.js` now
- `testimonialApi.js` later
- `useTestimonials.js`

#### ContactCTA
Responsibilities:
- Strong conversion section
- Encourage users to call, WhatsApp, or view properties

Data source:
- `homeContent.js`
- `siteConfig.js`

#### ContactFormSection
Responsibilities:
- Show contact form
- Validate form
- Handle submit loading/success/error states
- Prepare for Axios backend submission

Data source:
- `contactContent.js`
- `contactApi.js`
- `useContactForm.js`

---

### UI Components

Create reusable UI components:

- Button
- Container
- SectionHeader
- ServiceCard
- PropertyCard
- TestimonialCard
- Badge
- Input
- Select
- Textarea
- AppLoader
- PageLoader
- SectionLoader
- SkeletonCard
- LoadingState
- ErrorState
- EmptyState

UI components must receive data through props.

Do not hardcode project-specific repeated content inside reusable UI components.

---

## 13. Pages Architecture

### Home Page
The Home page assembles homepage sections only.

Sections:
1. Hero
2. TrustIndicators
3. AboutPreview
4. ServicesSection
5. FeaturedProperties
6. WhyChooseUs
7. PropertyManagementHighlight
8. ConsultancyHighlight
9. Testimonials
10. ContactCTA
11. ContactFormSection

The Home page should not contain long writeups or repeated card data.

### About Page
Should include:
- Company introduction
- Mission
- Vision
- Values
- Trust message
- CTA to contact

Content source:
- `aboutContent.js`

### Services Page
Should include:
- Services overview
- Full list of services
- Service benefits
- CTA

Data/content source:
- `servicesData.js`
- `servicesContent.js`

### Properties Page
Should include:
- Property listing grid
- Search
- Filter by property type
- Filter by status
- Filter by location
- Price range support later
- Sort support later
- Loading/error/empty states

Data source:
- `useProperties.js`

### Property Details Page
Should include:
- Property title
- Location
- Price
- Status
- Image/gallery
- Description
- Features
- Contact CTA
- Similar properties later

Data source:
- Route slug
- `useProperties.js`
- `propertyApi.js` later

### Contact Page
Should include:
- Contact form
- Phone
- Email
- WhatsApp
- Business information
- Map placeholder if needed

Content source:
- `contactContent.js`
- `siteConfig.js`

### NotFound Page
Should handle all unknown routes and provide a path back home.

---

## 14. Config Architecture

### siteConfig.js
Must contain:
- Brand name
- Tagline
- Slogans
- Phone number
- Email address
- WhatsApp link
- Social links
- Optional address

Known contact details:

- Phone: `+234 916 326 7765`
- Email: `austineokolie57@gmail.com`

### brandConfig.js
Must contain:
- Brand colors
- Font choices
- Brand design notes

### apiConfig.js
Must contain:
- API base URL
- API timeout
- API endpoint references if needed

### defaultImages.js
Must contain:
- default property image
- default hero image
- default avatar image
- default service image
- default gallery image
- default blog image
- logo fallback

---

## 15. Content Architecture

Use `content` for long writeups and section text.

Required content files:

- `homeContent.js`
- `aboutContent.js`
- `servicesContent.js`
- `propertiesContent.js`
- `contactContent.js`
- `seoContent.js`

Content examples:

- Hero headline
- Hero subtitle
- Section titles
- Section subtitles
- About paragraphs
- Service intro paragraphs
- CTA text
- SEO titles/descriptions

Do not place these long writeups inside components.

---

## 16. Data Architecture

Use `data` for temporary local data arrays.

Required files:

- `navLinks.js`
- `servicesData.js`
- `propertiesData.js`
- `testimonialsData.js`
- `trustIndicatorsData.js`
- `whyChooseUsData.js`
- `footerLinks.js`

Later, most of these can be replaced or supported by API responses.

---

## 17. Property Data Model

A property object should support these fields:

- id
- title
- slug
- location
- price
- currency
- type
- status
- bedrooms
- bathrooms
- area
- main image
- image alt text
- gallery images
- description
- features
- featured status
- created date
- updated date

The model should support:

- Property cards
- Property listings
- Property details page
- Search
- Filtering
- Sorting
- Featured properties
- Future admin dashboard
- Future backend API

---

## 18. Service Data Model

A service object should support:

- id
- title
- slug
- short description
- full description
- icon
- image optional
- features
- CTA text
- link

Core services:

- Property Sales
- Property Management
- Real Estate Consultancy
- Property Inspection
- Investment Advisory
- Land and Housing Solutions

---

## 19. Testimonial Data Model

A testimonial object should support:

- id
- client name
- client type/role
- service used
- rating
- quote
- avatar optional

Use default avatar if the avatar is missing.

---

## 20. API Architecture

Use Axios for backend communication.

Required API modules:

- `axiosClient.js`
- `propertyApi.js`
- `serviceApi.js`
- `testimonialApi.js`
- `contactApi.js`
- `newsletterApi.js`

### Future Backend Endpoints
Prepare frontend services for these possible endpoints:

- `GET /properties`
- `GET /properties/featured`
- `GET /properties/:slug`
- `GET /services`
- `GET /testimonials`
- `POST /contact`
- `POST /newsletter`

The first version can use local data, but the API layer must be prepared.

---

## 21. Hooks Architecture

Use hooks to connect data/API to UI.

Required hooks:

- `useProperties`
- `useServices`
- `useTestimonials`
- `useContactForm`
- `useNewsletter`

Hooks should manage:

- local data fallback
- API fetching later
- loading state
- error state
- empty state
- submit state where needed

Components should not directly contain Axios request logic.

---

## 22. Data Flow

### Current Local Data Flow

```txt
Page
  ↓
Section Component
  ↓
Reusable UI Component
  ↓
Local Data / Content / Config
```

### Future API Data Flow

```txt
Page
  ↓
Hook
  ↓
API Service
  ↓
Axios Client
  ↓
Backend API
  ↓
Database
```

The frontend must be built so the switch from local data to API data does not require rebuilding components from scratch.

---

## 23. Performance Requirements

The website must be optimized.

Rules:

- Use Vite
- Lazy-load routes where helpful
- Lazy-load images below the fold
- Do not lazy-load the main hero image if it is needed immediately
- Use optimized WebP images
- Avoid large UI libraries
- Avoid heavy animation libraries
- Avoid unnecessary state
- Avoid unnecessary effects
- Keep components small
- Use map for repeated content
- Use semantic HTML
- Use Tailwind for fast, consistent layout
- Use custom CSS only for special brand effects
- Use loading, error, and empty states
- Use skeleton loaders for property grids

---

## 24. SEO Requirements

Although this is an SPA, it must still be SEO-conscious.

Implement:

- Clear page titles
- Meta descriptions
- Open Graph image support
- SEO-friendly route structure
- Proper heading hierarchy
- Descriptive image alt text
- Clean property slugs
- Local real estate keyword strategy
- Future LocalBusiness schema support
- Future RealEstateListing/Property schema support

Important note:

If the project later needs strong Google ranking for many property detail pages, consider migrating to Next.js in the future. For now, build this as a React 19 SPA.

---

## 25. Accessibility Requirements

The website must be accessible.

Rules:

- Use semantic HTML
- Use readable color contrast
- Use accessible form labels
- Use keyboard-friendly navigation
- Use visible focus states
- Use alt text for images
- Use meaningful button/link text
- Mobile tap targets should be large enough
- Header mobile menu must be accessible
- Mobile drawer must support Escape key, overlay click, focus management, and route-change closing

---

## 26. Responsive Requirements

The website must work well on:

- Desktop
- Tablet
- Mobile

Mobile behavior:

- Header becomes hamburger menu with a dark green/gold off-canvas drawer
- Mobile nav links include Bootstrap-style icons
- Hero text remains readable
- CTA buttons stack when needed
- Cards stack vertically
- Property grid becomes one column
- Contact form becomes one column
- Footer sections stack cleanly

---

## 27. Contact System

Contact form should collect:

- Full name
- Email address
- Phone number
- Service interested in
- Message

The system should support:

- Validation
- Loading state
- Success state
- Error state
- Future Axios submission

Do not make the form purely visual. It should be backend-ready.

---

## 28. Future Backend/Admin Readiness

The public website should be ready for a future backend/admin dashboard.

Future admin dashboard may support:

- Add property
- Edit property
- Delete property
- Upload property images
- Mark property as featured
- Change property status
- View contact messages
- Manage services
- Manage testimonials
- Manage newsletter subscribers

The frontend architecture should not block these future upgrades.

---

## 29. Homepage Content Direction

Homepage sections must follow this order:

1. Header
2. Hero
3. Trust Indicators
4. About Preview
5. Services Section
6. Featured Properties
7. Why Choose Us
8. Property Management Highlight
9. Real Estate Consultancy Highlight
10. Testimonials
11. Contact CTA
12. Contact Form
13. Footer

The homepage should first build trust, then show services, then properties, then contact action.

---

## 30. Design Direction by Section

### Header
Clean, premium, sticky. Use dark green text, gold hover states, strong CTA button.

### Hero
Luxury real estate image, dark green overlay, gold accent, strong headline, two CTAs.

Hero headline:

“Find Your Perfect Property With Sureboy Realty”

Hero subtitle:

“Premium properties, prime investments, and trusted real estate solutions for buyers, sellers, landlords, and investors.”

### Services
Premium service cards with dark green titles and gold accents.

### Featured Properties
Premium listing cards with property image, price, status badge, location, and CTA.

### Why Choose Us
Dark green trust-building section with white text and gold icons/accents.

### Property Management Highlight
Professional landlord/property owner focused section.

### Consultancy Highlight
Investment-focused section with premium advisory tone.

### Testimonials
Clean testimonial cards with gold star accents.

### Contact CTA
Dark green high-conversion section with gold CTA button.

### Footer
Dark green footer with brand, links, services, contact details, newsletter, and social links.

---

## 31. Implementation Behavior for Codex/LLM

When implementing this project:

1. First set up the React 19 + Vite SPA.
2. Install and configure Tailwind CSS.
3. Install and configure Bootstrap-style icon package using individual SVG imports.
4. Build icon mapping architecture before using icons in components.
3. Install React Router.
4. Install Axios.
5. Create the full folder structure before building sections.
6. Create config files.
7. Create content files.
8. Create data files.
9. Create utilities.
10. Create API service layer.
11. Create hooks.
12. Create reusable UI components.
13. Create layout components.
14. Create section components.
15. Create pages.
16. Create routes.
17. Add custom loaders.
18. Add responsive styling.
19. Add SEO-conscious page structure.
20. Verify that no repeated content is hardcoded inside components.

---

## 32. Do Not Do These Things

Do not:

- Hardcode service cards directly inside section components
- Hardcode property cards directly inside pages
- Put long writeups inside JSX components
- Put contact details in multiple components manually
- Put Axios logic directly inside UI components
- Store image fallback logic inside cards
- Use random inconsistent colors
- Use too many styling systems
- Use heavy UI libraries unnecessarily
- Use heavy animation libraries unnecessarily
- Build it as a traditional multi-page app
- Treat `utils` as a page
- Put all images in `src/assets`
- Ignore missing image fallback cases
- Ignore loading/error/empty states

---

## 33. Final Expected Result

The completed project should be:

- React 19 based
- Vite powered
- SPA structured
- React Router enabled
- Tailwind CSS styled
- Custom CSS enhanced where necessary
- Axios ready
- Component-based
- Data-driven
- Content-separated
- Config-driven
- Image-fallback safe
- Backend-ready
- Responsive
- Accessible
- SEO-conscious
- Premium and professional in design

The most important architectural principle is:

**Keep UI, data, content, API logic, image fallback logic, and configuration separate.**

---

## 34. Implemented Design and Architecture Updates

These updates have been applied during the current frontend build and should be preserved going forward:

- The site is scaffolded as a React 19 + Vite SPA using React Router, Axios, Tailwind CSS, and individually imported Bootstrap-style SVG icons.
- The frontend dev script uses `vite --host` so the local dev server can be reached from other devices on the network when needed.
- The main navigation has been updated to a premium dark translucent utility bar inspired by the provided reference: hamburger + `Menu` trigger, centered Sureboy Realty wordmark, left utility actions, and right-side contact/favorite/account/language actions.
- The menu drawer now opens from the navigation trigger across desktop, tablet, and mobile, not only on mobile.
- The opened menu should cover the whole page on mobile, then become a slim emerald modal sidebar on tablet/desktop. On larger screens, the fixed top utility bar remains visible while page content behind the drawer is dimmed with a forest-green scrim.
- The opened menu uses `src/data/navLinks.js` for its main route list. Only the active page shows the gold vertical marker by default, and hovered links reveal the same marker while hovered.
- Mobile/drawer navigation should support low-literacy scanning while preserving the existing data-driven structure: route and utility link data include `iconKey` and short `helper` text, the drawer renders large icon-led touch rows, and the top of the drawer includes immediate Call Now and WhatsApp actions sourced from `siteConfig`.
- Menu links and bottom utility links use restrained sizing and slide left slightly on hover using a small negative translate animation.
- The opened menu includes a compact low-height Sureboy Realty navigation header with its own close control, a clear divider between main and utility links, subtle entrance motion, hidden native drawer scrollbars, and a bottom `Speak With an Agent` CTA that should remain reachable without normal desktop-height overflow.
- Bottom opened-menu utility links are stored in `src/data/mainMenuLinks.js`.
- The heart/favourite icon links to `/saved-houses`; `/saved-houses` and `/projects` are real SPA routes prepared for future saved listings and project collections.
- The project text scale has been reduced globally through Tailwind theme text-size variables in `src/styles/variables.css`.
- The navbar must float transparently over the hero by default, then switch only after the current hero section has passed. After the hero, it uses the exact background color `#063f2ca1` with no gold bottom border/hairline. Keep transparent and after-hero background utilities mutually exclusive in JSX so Tailwind background classes do not conflict. Navbar actions use subtle gold hover underlines, and the centered wordmark should stay restrained so it does not compete with hero headings. The opened menu/sidebar uses `brand-emerald`, with gold hover/accent states, Escape close, overlay close, and Tab focus trapping inside the drawer.
- After each implementation/design change, update this `agent.md` file so the guide stays in sync with the current project.
- All UI should use square/no-radius styling. Do not use Tailwind `rounded-*` utilities or custom `border-radius` unless the user explicitly asks for a rounded exception. Green buttons must use white text, and gold/default buttons plus button-like icon links should hover to emerald green with white text.
- Shared input, textarea, select, and newsletter fields should not show visible focus outlines or focus rings.
- Typography now combines Inter for readable body/UI text with Cormorant Garamond as the serif display font for headings.
- Home, About, Services, Properties, and Contact heroes use real downloaded image assets from `public/images/hero`.
- Secondary page heroes use the reusable `PageHero` component and remain content-driven through the content files.
- Native selects have been replaced with a custom searchable dropdown built from a button, search input, `ul`, and `li` options.
- Custom dropdowns support autocomplete suggestions, filtered `ul` options, keyboard navigation, Escape close, outside-click close, and an `X` icon to clear the dropdown search input.
- Property and service imagery, default fallback imagery, testimonial avatars, favicon, logo fallback, and Open Graph image are stored under `public/images` or `public` so local data/API-like paths resolve correctly.
- The app includes custom loaders, loading/error/empty states, local-data-first hooks, and API-ready service modules. The skip-to-content link should render only after the initial app loader finishes so it does not appear on the loader screen. Loader wrappers should use dynamic viewport height, centered content, and hidden overflow, and the app should clip horizontal overflow at the root/page level. The loader ring is an explicit rounded exception so the spinner remains circular.
- The initial app boot loader should be brief in normal usage. It currently uses a 650ms minimum display time so the brand loader is visible without delaying users for the earlier long confirmation delay.
- The footer follows the latest reference structure while keeping the project default footer color and avoiding black/charcoal footer blocks. Desktop keeps the large `Get In Touch` layout with emerald/gold contact action blocks, address/contact details, Navigation/Collection/Contact columns from `src/data/footerLinks.js`, bottom copyright/legal text, text-based social links, and a centered Call Us/Contact action strip. Mobile should match the provided reference order: Navigation and Collection in two columns first, then Contact, office/address details, social text links, copyright/legal text, and a Call Us/Contact action strip using emerald/gold styling.
- The Home page includes a data-driven floating `SectionNavigator` mounted only on Home. It uses `src/data/homeSectionLinks.js`, appears after the hero section, opens an emerald/gold section menu, highlights the active section with a gold marker, and supports smooth scrolling to each Home section. The section list opens from a solid forest-green right-edge icon trigger, while Back to Top stays at the page bottom-right on mobile and desktop. Both controls preserve button semantics for accessibility.
- The admin dashboard has been started under `src/admin/` and must remain separate from public pages/layout. Admin routes live under `/admin/*`, do not render the public Header/Footer, use `AdminProtectedRoute`, React Context memory auth, `AdminLayout`, `AdminSidebar`, `AdminTopbar`, admin pages, reusable admin UI/forms/tables, local fallback hooks, and API service files ready for Rust endpoints.
- The frontend API default base URL now points to the Rust API shape from the README: `http://localhost:8080/api`, while `VITE_API_BASE_URL` can still override it.
- Docker production builds set `VITE_API_BASE_URL=/api` and serve the built React app with Nginx from `frontend/Dockerfile`. `frontend/nginx.conf` proxies `/api` and `/uploads` to the Rust API container so public pages, admin requests, refresh cookies, and uploaded media stay on one browser origin.
- The root `.gitignore` keeps generated/runtime files out of git, including `node_modules`, `frontend/dist`, `api/target`, uploads, local `.env` files, logs, local Docker volume folders, and editor noise. Lockfiles and example env files should remain trackable.
- API mode is now enabled by default. `src/config/apiConfig.js` consumes the Rust API unless `VITE_USE_API=false` is explicitly set. `/admin/signup` calls `POST /api/admin/auth/signup`, and `/admin/login` calls `POST /api/admin/auth/login`.
- Admin access tokens must not be stored in `localStorage` or `sessionStorage`. The JWT returned by the Rust API is kept only in the admin React Context session (`AdminAuthProvider`) and mirrored into an in-memory Axios token bridge through `setAdminAuthToken`.
- Axios must attach the current in-memory admin access token in the request interceptor as `Authorization: Bearer <token>`. `axiosClient.js` owns `setAdminAuthToken`, `getAdminAuthToken`, and `clearAdminAuthToken`; admin code should not manually read/write token storage.
- Admin login/signup responses must return `{ accessToken, admin }` in JSON and set the refresh token only as the HttpOnly `sureboy_refresh_token` cookie. `AdminAuthProvider` keeps the access token in React memory only; React must never read or store the refresh token.
- `axiosClient` uses `withCredentials: true` so the refresh cookie is sent automatically to `POST /api/admin/auth/refresh`. Normal Axios requests send only the in-memory access token in `Authorization: Bearer <accessToken>`. If an admin request returns `401`, Axios calls the in-memory refresh handler once, the API reads/verifies the refresh cookie, rotates the cookie, returns a new `accessToken`, updates context/Axios memory, and retries the original request once.
- On a full page reload, `AdminAuthProvider` first calls `/api/admin/auth/refresh` to restore a valid in-memory access token from the HttpOnly refresh cookie. If refresh fails, or an admin API request returns `401`/`404` without a valid refresh path, the Axios response interceptor clears the in-memory session, dispatches `sureboy:admin-auth-invalid`, and redirects admin pages to `/admin/login`.
- Admin now includes `/admin/agents` so an admin can register other agents through `POST /api/admin/auth/agents` and view users from `GET /api/admin/auth/agents`.
- Admin properties, services, testimonials, messages, newsletter, settings, and dashboard hooks now fetch from the Rust API by default, with local fallback data preserved only when `VITE_USE_API=false`.
- In API mode, the admin dashboard must never show local fallback counts. It initializes all stat counts to `0`, keeps only non-count UI helpers such as quick actions, then replaces counts with backend `/api/admin/dashboard` values when the request succeeds.
- Public properties, services, testimonials, contact, and newsletter hooks now consume the Rust API by default and normalize Rust camelCase response fields into the existing frontend card shapes (`mainImage` to `image`, `propertyType` to `type`, `isFeatured` to `featured`, `clientRole` to `clientType`).
- Admin create/edit forms for properties, services, testimonials, and settings now submit to Rust API endpoints in API mode. Property gallery image paths are sent as `galleryImages`, and backend responses return persisted gallery images with the same camelCase field.
- Admin image fields now support real optimized file uploads. `AdminImageUploader` and `AdminGalleryUploader` post multipart files to `POST /api/admin/uploads/images`; the Rust API accepts jpg, jpeg, png, and webp uploads, saves the source with its original extension, converts every public thumbnail/medium/large variant to optimized WebP, and returns the large optimized `/uploads/...webp` URL for the existing path fields.
- Admin property videos now use `AdminVideoUploader`, which posts multipart files to `POST /api/admin/uploads/videos`. The Rust API compresses the upload to MP4, creates a poster WebP, and the property form stores only `videoUrl` and `videoPoster` so public property details can render the video when present.
- The Rust API now removes old uploaded media from disk when saved property, service, testimonial, or settings records are updated/deleted and no database record still references that upload group. Admin upload controls call `DELETE /api/admin/uploads` with one `path` or a `paths` array when replacing/removing unsaved media so loose uploads can be cleaned.
- Admin API lists now support pagination metadata plus `page`, `limit`, `search`, and relevant filters such as `status`, `role`, `propertyType`, `isActive`, and `isVisible`.
- Admin-vs-agent access is enforced by the Rust API: admins have full admin access, while agents can manage properties, upload/delete unused media, read/update messages, and read dashboard/session data only.
- Public contact/newsletter submits and admin auth posts are rate-limited by the Rust API through `RATE_LIMIT_WINDOW_SECONDS` and `RATE_LIMIT_MAX_REQUESTS`.
- Toast notifications use `react-hot-toast` through the shared helper in `src/utils/toast.jsx`. Keep all frontend/admin toast calls routed through `showSuccess`, `showError`, `showLoading`, `showToast`, `showWarning`, `dismissToast`, or `showPromise`. Toasts must be centered at the top, use gold background, forest-green text/border, square corners, bold 14px text, and no generic black toast theme.
- `App.jsx` mounts the global `AppToaster` after the boot loader. Public contact/newsletter flows, admin signup/login, admin agent registration, admin create/update forms, and admin image uploaders now use themed toast feedback.
