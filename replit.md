# Invoice Processing Dashboard

## Overview

This is a full-stack web application built for invoice processing and automated PO matching. The system allows users to upload invoice files (PDF, PNG, JPG), extract and process invoice data, and match them against purchase orders. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Dark Mode Theme System Implementation (January 31, 2025)
- Added complete dark/light mode theme system with automatic system preference detection
- Implemented theme provider with localStorage persistence
- Added theme toggle button in header with sun/moon icon animation
- Integrated theme settings in Settings page under Appearance section
- Updated all dashboard components to support proper dark mode styling:
  - Fixed vendor information cards and PO matching status displays
  - Updated status indicators and color schemes for both themes
  - Converted hardcoded colors to theme-aware CSS variables
  - Enhanced skeleton loading states with proper theme colors

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Upload**: Multer middleware for handling multipart/form-data
- **Session Management**: Express sessions with PostgreSQL store

### Key Components

#### Database Schema
- **Invoices Table**: Stores invoice data including vendor info, amounts, dates, status, and line items
- **Users Table**: Basic user management (present but not fully implemented)
- **Line Items**: JSON field within invoices for storing itemized invoice details

#### API Endpoints
- `GET /api/invoices` - Retrieve all invoices
- `GET /api/invoices/:id` - Get specific invoice details
- `POST /api/upload` - Upload and process invoice files

#### Frontend Components
- **Dashboard**: Main application view with invoice list and detail panels
- **Upload Panel**: Drag-and-drop file upload with progress tracking
- **Detail Panel**: Invoice viewing and editing interface
- **Layout Components**: Sidebar navigation and header

### Data Flow

1. **File Upload**: Users drag/drop or select invoice files through the upload panel
2. **Processing**: Backend receives files via multer, validates file types and size limits
3. **Data Extraction**: Invoice data is extracted and stored in PostgreSQL
4. **Display**: Frontend fetches and displays processed invoices in real-time
5. **Matching**: System compares invoice data against PO information for validation
6. **Status Updates**: Invoices are marked as matched, pending, or requiring review

### External Dependencies

#### Frontend Dependencies
- **UI Components**: Extensive Radix UI component library for accessible interfaces
- **Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Icons**: Lucide React for consistent iconography

#### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: Drizzle ORM with drizzle-zod for type-safe database operations
- **File Handling**: Multer for file upload processing
- **Session**: connect-pg-simple for PostgreSQL session storage

### Deployment Strategy

#### Development
- **Hot Reload**: Vite dev server with HMR for frontend development
- **API Proxy**: Vite configured to proxy API requests to Express server
- **Database**: Uses environment variable `DATABASE_URL` for connection
- **File Storage**: Local filesystem storage in development

#### Production Build
- **Frontend**: Static files built to `dist/public` directory
- **Backend**: Bundled with esbuild to `dist/index.js`
- **Static Serving**: Express serves frontend assets in production
- **Database Migration**: Drizzle Kit handles schema migrations

#### Configuration
- **Environment Variables**: Database URL and other sensitive config
- **TypeScript**: Shared types between frontend and backend via `shared/` directory
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

#### Storage Considerations
- **File Uploads**: Currently stored locally, can be extended to cloud storage
- **Database**: PostgreSQL with JSON fields for flexible line item storage
- **Session Data**: Stored in PostgreSQL for persistence across restarts

The application uses a modern, type-safe stack with excellent developer experience through hot reloading, shared types, and comprehensive UI components. The architecture supports both development and production deployments with clear separation of concerns between frontend and backend.