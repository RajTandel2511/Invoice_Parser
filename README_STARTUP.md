# 🚀 Invoice Parser - Startup Guide

## Quick Start (Recommended)

**To start both frontend and backend servers together:**

```bash
npm run start
```

This will:
- Start the backend server on `http://localhost:3001`
- Start the frontend server on `http://localhost:3000`
- Open both servers in separate command windows

## Alternative Methods

### Method 1: Using the batch file directly
```bash
.\start.bat
```

### Method 2: Start servers manually
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
cd client && npm run dev
```

## 🌐 Access URLs

### Local Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Network Access
- **Frontend**: http://192.168.1.71:3000
- **Backend API**: http://192.168.1.71:3001

## ✅ What Works

- ✅ **File Upload**: Upload PDF, PNG, JPG files
- ✅ **File Storage**: Files saved to `uploads/` folder
- ✅ **Multiple Files**: Upload multiple files at once
- ✅ **Network Access**: Works on both localhost and network IP
- ✅ **Progress Tracking**: Shows upload progress
- ✅ **File Validation**: 10MB limit, PDF/PNG/JPG only

## 🔧 Troubleshooting

### If upload fails:
1. Make sure both servers are running
2. Check that backend is on port 3001
3. Check that frontend is on port 3000
4. Try refreshing the browser

### If servers won't start:
1. Kill all Node.js processes: `taskkill /F /IM node.exe`
2. Run `npm run start` again

## 📁 File Storage

Uploaded files are saved to:
- `uploads/` folder
- Original format preserved
- Unique filenames with timestamps
- Accessible via file system 