# FibreUS - Electronic Security & Fiber Optic Services Platform

## Overview
FibreUS is a professional web application designed to connect clients with security contractors for electronic security and fiber optic services. Its primary purpose is to provide a comprehensive platform for managing service requests, tracking projects, and facilitating client communications. The platform aims to serve business clients requiring various security services (CCTV, alarm systems, access control, fiber installation) and to provide administrators and technicians with a modern, full-stack solution for managing these services, all while maintaining a professional brand identity.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **API Design**: RESTful, with role-based access control
- **Authentication**: Replit's OpenID Connect with session management
- **Database ORM**: Drizzle ORM
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Design
- **Primary Database**: PostgreSQL (Neon serverless hosting)
- **Schema Management**: Drizzle Kit
- **Core Entities**: Users (clients, admins, technicians), Service Requests, Projects, Tickets, Communications, Sessions.
- **User-Client Relationships**: Direct `userId` foreign key linking user accounts to client/lead records for secure data access.
- **Flexible Rate Structure**: Implemented `rate_types` and `service_rates` for a three-dimensional rate structure.
- **Support Plans**: `support_plans` table for recurring service offerings.
- **Ticket Management**: Project-based ticket system with `tickets` and `ticket_comments` tables.

### Authentication & Authorization
- **Provider**: Email/Password with Argon2id hashing
- **Session Management**: Secure HTTP-only cookies, PostgreSQL session store
- **User Roles**: Six-tier system (client, employee, sales, project_manager, manager, admin) with granular permissions.
- **Security**: CSRF protection, secure session configuration, role-based API access with server-side data filtering.
- **Data Access Control**: Client users access data via direct `userId` relationships.

### Design System
- **Brand Identity**: Professional security industry theme (navy and steel blue).
- **Typography**: Inter font family.
- **Component Library**: Custom-themed Shadcn/UI components.
- **Responsive Design**: Mobile-first with desktop optimization.
- **Theming**: Dark/Light mode with system preference detection.

### Business Logic & Features
- **Ticket Management System**: Project-based issue tracking with CRUD, status workflow, priorities, assignee management, due dates, comments, and share links.
- **Project Share Links**: Secure token generation for project sharing.
- **Public Quote/Invoice URLs**: Hybrid URL structure for public access with security tokens.
- **Print Functionality**: Dedicated print pages (`/print/quote/:id`, `/print/invoice/:id`) with print-only blue headers/footers. On screen, quote/invoice previews show subtle muted backgrounds; when printing (Ctrl+P), the top section (logo/address) and bottom section ("our services area") render with blue primary backgrounds and white text. Print buttons navigate to print pages instead of dialogs, with toast messages for unsaved documents.
- **Quote/Invoice PDF Generation**: Uses `html2canvas` for pixel-perfect PDF capture.
- **Lead Generation**: Public lead generation forms with backend API integration for various service requests.
- **SEO Optimization**: Static `sitemap.xml` endpoint and `robots.txt` for crawler control.
- **Access Control**: Simplified three-tier model for GET endpoints across tickets, projects, tasks, and reports.
- **Activity Logs**: System activity logs displayed from the `activities` table with role-based filtering.

## External Dependencies

### Core Infrastructure
- **Database Hosting**: Neon PostgreSQL serverless platform
- **Authentication**: Replit's OpenID Connect service
- **Development Environment**: Replit hosting

### UI and Styling
- **Component Framework**: Radix UI
- **Icon Library**: Lucide React
- **Font Loading**: Google Fonts
- **CSS Framework**: Tailwind CSS with PostCSS

### Development and Utilities
- **Validation**: Zod
- **Date Handling**: date-fns

### Production Dependencies
- **Session Management**: connect-pg-simple
- **Database Driver**: @neondatabase/serverless
- **Runtime**: Node.js