# Design Guidelines: Electronic Security Company Web Application

## Design Approach
**Reference-Based Approach** - Drawing inspiration from professional security and technology companies like ADT, Honeywell, and modern SaaS platforms. The design balances trust and professionalism with modern web aesthetics to convert prospects into clients.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Deep Navy: 220 85% 15% (trust, security, professionalism)
- Steel Blue: 210 40% 35% (technology, reliability)

**Light Mode Supporting Colors:**
- Light Gray: 220 15% 95% (backgrounds)
- Charcoal: 220 25% 25% (text)
- White: 0 0% 100% (cards, sections)

**Dark Mode Supporting Colors:**
- Dark Navy: 220 50% 8% (backgrounds)
- Medium Gray: 220 15% 75% (text)
- Dark Steel: 220 30% 18% (cards, sections)

**Secondary Color:**
- Oxblood: 10 60% 30% (secondary CTAs, accents) - professional burgundy tone for trust

**Accent Color:**
- Electric Blue: 200 85% 55% (CTAs, highlights) - used sparingly for conversion elements

### B. Typography
**Primary Font:** Inter (Google Fonts)
- Headings: 600-700 weight
- Body: 400-500 weight
- UI Elements: 500 weight

**Secondary Font:** JetBrains Mono (for technical specifications and system details)

### C. Layout System
**Tailwind Spacing Units:** 2, 4, 6, 8, 12, 16
- Tight spacing: 2-4 for form elements
- Standard spacing: 6-8 for content sections
- Generous spacing: 12-16 for major section breaks

### D. Component Library

**Navigation:**
- Clean header with company logo, service dropdown menus
- Sticky navigation with subtle shadow on scroll
- Mobile hamburger menu with slide-out panel

**Service Cards:**
- Clean grid layout with service icons
- Hover states with subtle elevation
- Clear pricing and "Get Quote" CTAs

**Forms:**
- Professional styling with clear labels
- Multi-step quote request forms
- Form validation with inline feedback

**Client Portal:**
- Dashboard with service status cards
- Clean data tables for service history
- Document upload/download areas

**Admin Dashboard:**
- Sidebar navigation with role-based access
- Data visualization for business metrics
- Client management interface

### E. Page-Specific Treatments

**Landing Page (Marketing):**
- Hero section with security-focused imagery overlay
- Trust indicators: certifications, years in business
- Service overview grid with conversion-focused CTAs
- Client testimonials and case studies
- Maximum 4 sections to maintain focus

**Service Pages:**
- Technical specification tables
- Before/after project galleries
- Equipment showcase with professional photography
- Clear pricing tiers and consultation CTAs

**Client Portal:**
- Clean, utility-focused design
- Service request forms and status tracking
- Document library and communication center
- Minimal distractions, maximum functionality

## Images
**Hero Image:** Large, professional photograph of a security installation or monitoring room with subtle dark overlay for text legibility. Consider imagery showing modern security equipment, professional technicians, or sophisticated control centers.

**Service Images:** High-quality photos of CCTV cameras, access control systems, alarm panels, and completed installations. Use consistent lighting and angles for brand cohesion.

**Team Photos:** Professional headshots with consistent background treatment, showcasing expertise and approachability.

**Project Gallery:** Before/after installation photos, wide shots of secured facilities, close-ups of equipment details.

## Conversion Optimization
- Prominent "Get Free Quote" buttons throughout
- Trust signals: certifications, insurance badges, BBB ratings
- Clear service differentiation with benefit-focused copy
- Streamlined contact forms with minimal friction
- Mobile-first responsive design for on-site consultations