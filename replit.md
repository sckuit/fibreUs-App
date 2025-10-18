# FibreUS - Electronic Security & Fiber Optic Services Platform

## Overview

FibreUS is a professional electronic security and fiber optic services web application that connects clients with security contractors. The platform provides a comprehensive solution for managing security service requests, project tracking, and client communications. It serves both business clients seeking security services (CCTV, alarm systems, access control, fiber installation) and administrators/technicians managing those services.

The application follows a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database, designed specifically for the electronic security industry with professional branding and user experience.

## Recent Changes

### October 2025 - Rate Types & Support Plans System
- **Flexible Rate Structure**: Replaced fixed hourly rate fields with flexible rate_types system allowing custom rate categories
- **Service Rates Table**: Three-dimensional rate structure (rate type × time period) with regular, after-hours, and holiday rates for each rate type
- **Support Plans**: Dedicated support_plans table for recurring service offerings with customizable rates and billing periods (monthly, quarterly, annual, per-hour)
- **Database Schema**: Created three new tables:
  - `rate_types`: Stores rate type definitions (e.g., Phone/Remote Service, Trip Rate, Onsite Service, Bench Time) with custom flag and display order
  - `service_rates`: Links each rate type to three time-period rates (regular, after-hours, holiday) plus notes field
  - `support_plans`: Stores support plan offerings with rate, billing period, description, and custom flag
- **Auto-Creation Logic**: When a new rate type is created, corresponding service_rate record is automatically generated with null default values
- **Default Data**: Seeded 4 standard rate types (Phone/Remote, Trip, Onsite, Bench) and 2 support plans (Phone Support monthly, Remote Programming per-hour)
- **API Routes**: Full CRUD routes for /api/rate-types, /api/service-rates, /api/support-plans with manageSettings permission
- **LegalManager UI**: Redesigned with three sections: Legal Documents, Service Rates table (editable grid), and Support Plans management
- **Decimal Handling**: Proper empty string to undefined conversion in Zod schemas, with undefined to null conversion in storage layer

### October 2025 - QuotePreview Redesign & PDF Generation Overhaul
- **Professional Header Design**: Redesigned QuotePreview with dark blue (#1e3a5f) full-width header featuring company logo (left), stacked company name/tagline (center-left), and right-aligned white contact information
- **Metadata Repositioning**: Moved quote metadata (Quote #, Date, Valid Until) below header as separate bordered section with left/right alignment for cleaner visual hierarchy
- **Bill To Section Enhancement**: Updated customer information section with cleaner typography and professional formatting
- **html2canvas Integration**: Complete PDF generation rewrite using html2canvas to capture QuotePreview component directly for pixel-perfect PDF copies
- **forwardRef Implementation**: Converted QuotePreview to forwardRef component exposing DOM element reference for html2canvas capture
- **Multi-page PDF Slicing**: Implemented robust page-break handling with proper slice height clamping (Math.ceil for ideal height, Math.min for actual height) to eliminate gaps and content duplication across pages
- **Edge Case Handling**: Added sourceHeight calculation to prevent reading past canvas end on final page, ensuring clean multi-page exports for long quotes
- **Services Footer**: Added dynamic services section at bottom of quotes with blue background matching header, displaying all active services in 2-column grid with readable 12px+ typography
- **Flex Layout Structure**: Implemented flex column layout with min-h-[1100px] on Card and flex-1 on CardContent to properly position services footer at page bottom and prevent PDF overflow
- **Quote Save Fix**: Made quoteNumber optional in insertQuoteSchema - backend auto-generates in format Q-YYYY-00001
- **Price Matrix Updates**: Fixed update functionality by changing PATCH to PUT to match backend API route
- **Schema Type Safety**: Extended updateQuoteSchema with explicit string type for validUntil field to match form handling
- **Supplier Database Expansion**: Added 5 major security industry vendors (Avigilon, Schneider Electric Security, Bosch Security Systems, Hikvision USA, Pelco)
- **Price Matrix Expansion**: Populated with 10 additional items including access control readers, intrusion sensors, NVR systems, PTZ cameras, alarm panels, motion detectors, cable installation, system programming, and monitoring services

### October 2025 - Frontpage Database Integration
- **Public System Config API**: Made /api/system-config endpoint publicly accessible (removed authentication) to enable frontpage data loading
- **PublicHeader Integration**: Header now displays company name, phone, email, and emergency contact from database with proper fallbacks
- **Hero Section Integration**: Hero component pulls company name, header tagline, about text, and emergency phone from systemConfig
- **About Section Integration**: About section uses database-driven company name, mission, and aboutUs text
- **Services Filtering**: ServicesSection filters displayed services based on selectedFrontpageServices array from database with Array.isArray validation
- **Login Dialog Fix**: Sign In button now uses LoginDialog component (popup) instead of navigating to non-existent /login page
- **Type Safety**: All frontpage components use proper SystemConfig type with defensive fallback values

### October 2025 - Flyer Redesign & Enhanced Features
- **Service Discounts**: Added discountPercent field to service_types table for promotional pricing
- **Personalized Messages**: Flyer builder now supports custom personalized messages (e.g., "Dear [Name]...")
- **Pricing Display Toggle**: Option to show/hide service pricing on flyers with automatic discount calculations
- **Logo Sizing**: Reduced flyer logo height to 3/4 (96px) for better visual balance
- **Contact Section Redesign**: Merged company and sales contact into unified "Let's Get Started" section with separate client/lead "Prepared for" panel
- **Pricing Visualization**: Services display original price (strikethrough), discounted price (green), and discount percentage when applicable
- **Form Null Handling**: Fixed TypeScript errors by converting null form values to empty strings in AppConfigDialog
- **Header Address Display**: Added client/lead address display below recipient name in flyer header for better context

### October 2025 - Task/Report Editing & Schema Fixes
- **Task Editing**: Updated PUT /api/tasks/:id to allow users with manageOwnTasks to edit their assigned tasks
- **Report Editing**: Updated PUT /api/reports/:id to allow users with manageOwnReports to edit their submitted reports
- **Project Access**: Fixed GET /api/projects to filter by assignedTechnicianId for employees (allows them to see assigned projects when creating tasks/reports)
- **Report Schema Fix**: Added submittedById and rejectionReason to insertReportSchema omit list - these fields are set by the backend, not the form
- **Permission System Fix**: Updated task and report routes to allow users with viewOwnTasks/viewOwnReports to access their assigned items
- **Delete Routes Analysis**: Comprehensive foreign key dependency analysis for all 9 DELETE endpoints:
  - HIGH DEPENDENCY (users): 15+ FK references → requires soft delete strategy
  - MEDIUM DEPENDENCY (inventory, tasks, inquiries, leads, clients): 1-2 FK references → needs dependency checks
  - LOW DEPENDENCY (reports, sales_records, suppliers): No FK references → safe for hard delete
- **Improved Error Handling**: User delete route now returns helpful 409 Conflict message when FK constraints prevent deletion

### December 2024 - Navigation & Permissions Overhaul
- **Simplified Top Navigation**: Streamlined to show only Dashboard link, welcome name, role badge, and sign out button
- **Granular Role Permissions**: Implemented detailed permission system in `shared/permissions.ts` with specific tab access for each role
- **Settings Tab Enhancement**: Added user profile display with ability to view and update personal information
- **Login Flow Fix**: All authenticated users now redirect to /dashboard (unified portal experience)
- **Dashboard Tab Visibility**: Tabs dynamically show/hide based on role-specific permissions using hasPermission() checks

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system for professional security industry branding
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and API caching
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful endpoints with role-based access control
- **Authentication**: Replit's OpenID Connect integration with session management
- **Database ORM**: Drizzle ORM with type-safe database operations
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Core Entities**:
  - Users (clients, admins, technicians with role-based permissions)
  - Service Requests (CCTV, alarm, access control, etc.)
  - Projects (approved requests converted to active work)
  - Communications (message threads between parties)
  - Sessions (authentication state management)

### Authentication & Authorization
- **Provider**: Email/Password authentication with Argon2id hashing
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **User Roles**: Six-tier system (client, employee, sales, project_manager, manager, admin) with granular permissions
- **Security**: CSRF protection, secure session configuration, role-based API access
- **Login Flow**: All users redirect to /dashboard upon successful authentication

### Role-Based Permissions (Granular CRUD Access Control)
- **Client**: Basic access to own requests and projects (view only)
- **Employee**: Full CRUD on assigned Tasks, Projects, and Reports only (linked to assignments)
- **Sales**: Full CRUD on Tasks, Projects, Reports, Suppliers, Messages, Clients, Leads + view Visitors (NO Users tab)
- **Project Manager**: Full CRUD on Tasks, Projects, Reports, Inventory, Suppliers, Clients (NO Users tab)
- **Manager**: Full CRUD on Users, Tasks, Projects, Reports, Suppliers, Messages, Clients, Leads, Financial + view Visitors
- **Admin**: Complete system access with full CRUD on all entities including Activities and system management

### Design System
- **Brand Identity**: Professional security industry theme with deep navy and steel blue colors
- **Typography**: Inter font family for modern, readable interface
- **Component Library**: Custom-themed Shadcn/UI components with security industry styling
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark/Light Mode**: Theme provider with system preference detection

### Business Logic Architecture
- **Service Types**: Enum-driven service categorization (CCTV, alarm, access control, intercom, cloud storage, monitoring, fiber installation, maintenance)
- **Request Workflow**: Status-driven progression (pending → reviewed → quoted → approved → scheduled → in_progress → completed)
- **Priority System**: Four-level priority management (low, medium, high, urgent)
- **Communication Threads**: Integrated messaging system for project coordination

## External Dependencies

### Core Infrastructure
- **Database Hosting**: Neon PostgreSQL serverless platform
- **Authentication**: Replit's OpenID Connect service
- **Development Environment**: Replit hosting and development platform
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation

### UI and Styling
- **Component Framework**: Radix UI primitives for accessible components
- **Icon Library**: Lucide React for consistent iconography
- **Font Loading**: Google Fonts (Inter, JetBrains Mono, DM Sans, Geist Mono)
- **CSS Framework**: Tailwind CSS with PostCSS processing

### Development and Utilities
- **Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date manipulation and formatting
- **HTTP Client**: Fetch API with custom query client wrapper
- **TypeScript**: Full type safety across frontend and backend with shared schemas

### Production Dependencies
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Database Driver**: @neondatabase/serverless for optimized Neon connections
- **Runtime**: Node.js with ESM module support
- **Process Management**: tsx for TypeScript execution in development