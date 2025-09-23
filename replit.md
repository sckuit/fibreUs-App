# FibreUS - Electronic Security & Fiber Optic Services Platform

## Overview

FibreUS is a professional electronic security and fiber optic services web application that connects clients with security contractors. The platform provides a comprehensive solution for managing security service requests, project tracking, and client communications. It serves both business clients seeking security services (CCTV, alarm systems, access control, fiber installation) and administrators/technicians managing those services.

The application follows a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database, designed specifically for the electronic security industry with professional branding and user experience.

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
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **User Roles**: Three-tier system (client, admin, technician) with route protection
- **Security**: CSRF protection, secure session configuration, role-based API access

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