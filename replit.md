# FibreUS - Electronic Security & Fiber Optic Services Platform

## Overview

FibreUS is a professional electronic security and fiber optic services web application that connects clients with security contractors. The platform provides a comprehensive solution for managing security service requests, project tracking, and client communications. It serves both business clients seeking security services (CCTV, alarm systems, access control, fiber installation) and administrators/technicians managing those services.

The application follows a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database, designed specifically for the electronic security industry with professional branding and user experience.

## Recent Changes

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