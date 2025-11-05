# FibreUS - Electronic Security & Fiber Optic Services Platform

## Overview
FibreUS is a professional web application connecting clients with security contractors for electronic security and fiber optic services. It provides a comprehensive solution for managing service requests, project tracking, and client communications. The platform targets business clients needing security services (CCTV, alarm systems, access control, fiber installation) and administrators/technicians managing these services, offering a modern full-stack solution with a professional brand identity.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **2025-11-05**: Fixed public quote approve/reject endpoints - removed authentication requirement since token verification provides sufficient security. Added middleware to populate `req.user` from session for authenticated routes.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: Shadcn/UI (built on Radix UI)
- **Styling**: Tailwind CSS with a custom design system
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js
- **API Design**: RESTful, role-based access control
- **Authentication**: Replit's OpenID Connect with session management
- **Database ORM**: Drizzle ORM
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Design
- **Primary Database**: PostgreSQL (Neon serverless hosting)
- **Schema Management**: Drizzle Kit
- **Core Entities**: Users (clients, admins, technicians), Service Requests, Projects, Communications, Sessions.
- **User-Client Relationships**: Direct `userId` foreign key in `clients` and `leads` tables linking user accounts to client/lead records for secure data access control.
- **Flexible Rate Structure**: Implemented `rate_types` (e.g., Phone/Remote Service, Trip Rate) and `service_rates` (three-dimensional rate structure by time period).
- **Support Plans**: `support_plans` table for recurring service offerings with customizable rates and billing periods.

### Authentication & Authorization
- **Provider**: Email/Password with Argon2id hashing
- **Session Management**: Secure HTTP-only cookies, PostgreSQL session store
- **User Roles**: Six-tier system (client, employee, sales, project_manager, manager, admin) with granular permissions.
- **Security**: CSRF protection, secure session configuration, role-based API access with server-side data filtering.
- **Data Access Control**: Client users access data via direct `userId` relationships in database, not email matching, ensuring secure isolation of client data.
- **Login Flow**: All authenticated users redirect to `/dashboard`.

### Role-Based Permissions
- **Granular CRUD Access**: Permissions are defined for specific tab access and CRUD operations based on user role.
- **Client**: View own requests/projects.
- **Employee**: CRUD on assigned Tasks, Projects, Reports.
- **Sales**: CRUD on Tasks, Projects, Reports, Suppliers, Messages, Clients, Leads; view Visitors.
- **Project Manager**: CRUD on Tasks, Projects, Reports, Inventory, Suppliers, Clients.
- **Manager**: CRUD on Users, Tasks, Projects, Reports, Suppliers, Messages, Clients, Leads, Financial; view Visitors.
- **Admin**: Full system access, including Activities and system management.

### Design System
- **Brand Identity**: Professional security industry theme (navy and steel blue).
- **Typography**: Inter font family.
- **Component Library**: Custom-themed Shadcn/UI components.
- **Responsive Design**: Mobile-first with desktop optimization.
- **Theming**: Dark/Light mode with system preference detection.

### Business Logic & Features
- **Public Quote/Invoice URLs**: Hybrid URL structure (`/quote/:quoteNumber/:token`) for public access, maintaining security tokens while exposing document numbers. Includes backward compatibility for old URLs.
- **Dashboard Search/Pagination**: Implemented search and pagination for project overviews.
- **Quote/Invoice PDF Generation**: Uses `html2canvas` for pixel-perfect PDF capture of QuotePreview, with robust multi-page handling.
- **Frontpage Integration**: Publicly accessible system configuration for dynamic content display (company info, services).
- **Flyer Generation**: Supports service discounts, personalized messages, and optional pricing display with discount calculations.
- **Task/Report Editing**: Users can edit their assigned tasks and reports based on permissions (`manageOwnTasks`, `manageOwnReports`).
- **Service Types**: Enum-driven categorization (CCTV, alarm, access control, etc.).
- **Request Workflow**: Status-driven progression (pending → reviewed → quoted → approved → scheduled → in_progress → completed).
- **Priority System**: Four levels (low, medium, high, urgent).
- **Communication Threads**: Integrated messaging for project coordination.

## External Dependencies

### Core Infrastructure
- **Database Hosting**: Neon PostgreSQL serverless platform
- **Authentication**: Replit's OpenID Connect service
- **Development Environment**: Replit hosting
- **Build Tools**: Vite (frontend), esbuild (backend)

### UI and Styling
- **Component Framework**: Radix UI
- **Icon Library**: Lucide React
- **Font Loading**: Google Fonts
- **CSS Framework**: Tailwind CSS with PostCSS

### Development and Utilities
- **Validation**: Zod
- **Date Handling**: date-fns
- **HTTP Client**: Fetch API
- **TypeScript**: Full type safety

### Production Dependencies
- **Session Management**: connect-pg-simple
- **Database Driver**: @neondatabase/serverless
- **Runtime**: Node.js
- **Process Management**: tsx (development)