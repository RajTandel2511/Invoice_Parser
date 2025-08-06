# InvoiceFlow - Invoice Processing System

A modern React-based invoice processing system with Python backend for OCR and invoice processing. Supports both localhost and network deployment.

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
- Python 3.8+
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
   pip install -r requirements.txt
   ```

3. **Start the development servers**
   ```bash
   npm run dev-all
   ```
   
   Or use the network-ready startup script:
   ```bash
   start-network.bat
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend API server
- `npm run dev-all` - Start both frontend and backend servers
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
├── process/               # Python invoice processing pipeline
│   ├── notebooks/         # Python scripts for OCR and processing
│   ├── data/             # Reference files and data
│   └── outputs/          # Generated Excel and text files
├── shared/               # Shared TypeScript types
├── uploads/              # File upload directory
└── server.js             # Express.js backend API server
```

## Features Overview

### Dashboard
- Upload new invoices with drag & drop
- View all invoices with real processing
- Edit invoice details inline
- Status tracking (Matched, Review Needed, Processing)

### Upload System
- Drag & drop file upload (supports multiple files)
- Support for PDF, PNG, JPG files
- Progress tracking during upload
- File size validation (10MB per file)
- Real OCR processing with Python backend

### Invoice Processing
- OCR text extraction from PDFs
- AI-powered invoice data extraction
- Purchase order number detection
- Automatic vendor matching
- Excel file generation for Spectrum import

### PO Matching
- Match invoices with purchase orders
- Search and filter unmatched invoices
- Status indicators for matching results

### Invoice Management
- Detailed invoice view with all fields
- Edit invoice information
- Reprocess invoices
- Line item management

## Network Access

The application supports both local and network deployment:

### Local Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002

### Network Access
- **Frontend**: http://192.168.1.71:3000 or http://192.168.1.130:3000
- **Backend API**: http://192.168.1.71:3002 or http://192.168.1.130:3002

## Development

This is a full-stack application with React frontend and Python backend for invoice processing.

### Key Components

- **Frontend API**: `client/src/lib/api.ts` - Handles API calls to backend
- **Backend Server**: `server.js` - Express.js API server
- **Python Pipeline**: `process/notebooks/invoice_pipeline_combined.py` - OCR and processing
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