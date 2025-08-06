# InvoiceFlow - Frontend Demo

A modern React-based invoice processing dashboard built with TypeScript, Tailwind CSS, and shadcn/ui components. This is a frontend-only demo version with mock data for localhost development.

## Features

- 📄 Upload and process invoice files (PDF, PNG, JPG) with drag & drop
- 🔍 View and edit invoice details with mock data
- 📊 Dashboard with invoice management and PO matching
- 🎨 Dark/Light mode theme system
- 📱 Responsive design for all devices
- 🎯 Modern UI with shadcn/ui components

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing
- **React Hook Form** with Zod validation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd InvoiceFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check with TypeScript

## Project Structure

```
InvoiceFlow/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── invoice/    # Invoice-related components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── theme/      # Theme components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   └── index.html
├── shared/               # Shared TypeScript types
└── uploads/              # File upload directory (for demo)
```

## Features Overview

### Dashboard
- Upload new invoices with drag & drop
- View all invoices with mock data
- Edit invoice details inline
- Status tracking (Matched, Review Needed, Processing)

### Upload System
- Drag & drop file upload (supports multiple files)
- Support for PDF, PNG, JPG files
- Progress tracking during upload
- File size validation (10MB per file)

### PO Matching
- Match invoices with purchase orders
- Search and filter unmatched invoices
- Status indicators for matching results

### Invoice Management
- Detailed invoice view with all fields
- Edit invoice information
- Reprocess invoices
- Line item management

## Mock Data

The application uses mock data to simulate a real invoice processing system:

- **Sample Invoices**: Pre-loaded with 3 example invoices
- **Upload Simulation**: Simulates file processing with delays
- **PO Matching**: Simulates matching logic with random results
- **Status Updates**: Tracks invoice processing status

## Development

This is a frontend-only demo application. All data is stored in memory and resets when you refresh the page. The mock API simulates real API calls with appropriate delays and responses.

### Key Components

- **Mock API**: `client/src/lib/mockApi.ts` - Handles all data operations
- **Query Client**: `client/src/lib/queryClient.ts` - Manages API calls and caching
- **Components**: Modular React components with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui design system

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory

3. Deploy the `dist` folder to any static hosting service (Vercel, Netlify, etc.)

## License

MIT 