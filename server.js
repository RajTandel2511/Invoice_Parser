import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3002;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const newFilename = `${nameWithoutExt}_${timestamp}${extension}`;
    cb(null, newFilename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow only PDF, PNG, JPG files
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    };

    console.log('File uploaded:', fileInfo);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Get uploaded files list
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep')
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          uploadDate: stats.mtime,
          path: filePath
        };
      });

    res.json({
      success: true,
      files: files
    });

  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading uploaded files',
      error: error.message
    });
  }
});

// Download file endpoint
app.get('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file',
      error: error.message
    });
  }
});

// Delete file endpoint
app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);
    
    console.log(`File deleted: ${filename}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Download processed files endpoints
app.get('/api/download/ap-invoices', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'APInvoicesImport1.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'APInvoicesImport1.xlsx not found. Please process invoices first.'
      });
    }

    res.download(filePath, 'APInvoicesImport1.xlsx');

  } catch (error) {
    console.error('Download AP invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading AP invoices file',
      error: error.message
    });
  }
});

app.get('/api/download/invoice-spectrum', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'invoice_spectrum_format.txt');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'invoice_spectrum_format.txt not found. Please process invoices first.'
      });
    }

    res.download(filePath, 'invoice_spectrum_format.txt');

  } catch (error) {
    console.error('Download invoice spectrum error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading invoice spectrum file',
      error: error.message
    });
  }
});

// Check if processed files exist
app.get('/api/check-processed-files', (req, res) => {
  try {
    const apInvoicesPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'APInvoicesImport1.xlsx');
    const spectrumPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'invoice_spectrum_format.txt');
    
    const apInvoicesExists = fs.existsSync(apInvoicesPath);
    const spectrumExists = fs.existsSync(spectrumPath);
    
    res.json({
      success: true,
      apInvoicesExists,
      spectrumExists,
      bothExist: apInvoicesExists && spectrumExists
    });

  } catch (error) {
    console.error('Check processed files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking processed files',
      error: error.message
    });
  }
});

// Get vendor matches endpoint
app.get('/api/vendor-matches', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'matched_vendors_from_txt.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        success: false,
        message: 'Vendor matches file not found'
      });
    }

    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) {
      return res.json({
        success: true,
        matches: []
      });
    }

    // Parse CSV (simple parsing for now)
    const headers = lines[0].split(',');
    const matches = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const match = {};
      
      headers.forEach((header, index) => {
        match[header.trim()] = values[index] ? values[index].trim() : '';
      });
      
      matches.push(match);
    }

    res.json({
      success: true,
      matches: matches
    });
  } catch (error) {
    console.error('Error reading vendor matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read vendor matches'
    });
  }
});

// Process invoices endpoint
app.post('/api/process-invoices', async (req, res) => {
  try {
    // Clear the last content hash to ensure we detect new data
    const lastContentHashPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'last_content_hash.txt');
    if (fs.existsSync(lastContentHashPath)) {
      try {
        fs.unlinkSync(lastContentHashPath);
        console.log('Cleared last content hash for new processing session');
      } catch (error) {
        console.error('Error clearing content hash:', error);
      }
    }
    
    // Clear the last PO content hash to ensure we detect new data
    const lastPOContentHashPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'last_po_content_hash.txt');
    if (fs.existsSync(lastPOContentHashPath)) {
      try {
        fs.unlinkSync(lastPOContentHashPath);
        console.log('Cleared last PO content hash for new processing session');
      } catch (error) {
        console.error('Error clearing PO content hash:', error);
      }
    }
    
    // Check if uploads directory exists and has files
    if (!fs.existsSync(uploadsDir)) {
      return res.status(400).json({
        success: false,
        message: 'Uploads directory does not exist'
      });
    }

    const files = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && file.endsWith('.pdf'));

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No PDF files found in uploads directory'
      });
    }

    // Create raw_pdfs directory if it doesn't exist
    const rawPdfsDir = path.join(__dirname, 'process', 'data', 'raw_pdfs');
    if (!fs.existsSync(rawPdfsDir)) {
      fs.mkdirSync(rawPdfsDir, { recursive: true });
    }

    // Move files from uploads to raw_pdfs
    const movedFiles = [];
    for (const file of files) {
      const sourcePath = path.join(uploadsDir, file);
      const destPath = path.join(rawPdfsDir, file);
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        fs.unlinkSync(sourcePath); // Remove from uploads
        movedFiles.push(file);
        console.log(`Moved file: ${file}`);
      } catch (error) {
        console.error(`Error moving file ${file}:`, error);
      }
    }

    if (movedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to move any files'
      });
    }

    // Execute Python script in background
    const pythonScriptPath = path.join(__dirname, 'process', 'notebooks', 'invoice_pipeline_combined.py');
    const processDir = path.join(__dirname, 'process');

    console.log(`Executing Python script: ${pythonScriptPath}`);
    console.log(`Working directory: ${processDir}`);

    // Clean up any old approval flags before starting new processing
    const oldVendorFlagPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'approval_needed.flag');
    const oldPOFlagPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'po_approval_needed.flag');
    
    try {
      if (fs.existsSync(oldVendorFlagPath)) {
        fs.unlinkSync(oldVendorFlagPath);
        console.log('Cleared old vendor approval flag for new processing');
      }
      if (fs.existsSync(oldPOFlagPath)) {
        fs.unlinkSync(oldPOFlagPath);
        console.log('Cleared old PO approval flag for new processing');
      }
    } catch (error) {
      console.error('Error clearing old approval flags:', error);
    }

    const pythonProcess = spawn('python', ['notebooks/invoice_pipeline_combined.py'], {
      cwd: processDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    // Handle process events
    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process closed with code ${code}`);
    });

    // Don't wait for the Python process to complete
    // Instead, return immediately and let the frontend poll for approval
    res.json({
      success: true,
      message: `Started processing ${movedFiles.length} files. The system will pause for vendor approval when ready.`,
      files: movedFiles
    });

  } catch (error) {
    console.error('Process invoices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Processing failed'
    });
  }
});

// Check if approval is needed
app.get('/api/check-approval-needed', async (req, res) => {
  try {
    console.log('Checking if approval is needed...');
    
    const approvalFlagPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'approval_needed.flag');
    const csvPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'matched_vendors_from_txt.csv');
    
    const approvalNeeded = fs.existsSync(approvalFlagPath);
    const csvExists = fs.existsSync(csvPath);
    
    console.log('Approval flag exists:', approvalNeeded);
    console.log('Vendor CSV file exists:', csvExists);
    
    // Check if approval is needed - the Python script creates this flag when it needs user input
    if (approvalNeeded) {
      console.log('Approval flag exists - should show approval dialog');
    } else {
      console.log('No approval flag - no approval needed');
      return res.json({
        success: true,
        approvalNeeded: false,
        matches: []
      });
    }
    
    // Also check if the CSV file has content (not just exists)
    let csvHasContent = false;
    let csvContent = '';
    if (csvExists) {
      try {
        const csvStats = fs.statSync(csvPath);
        csvContent = fs.readFileSync(csvPath, 'utf-8');
        csvHasContent = csvContent.trim().length > 0;
        console.log('Vendor CSV file has content:', csvHasContent);
        console.log('Vendor CSV file size:', csvContent.length, 'characters');
        console.log('Vendor CSV file modification time:', csvStats.mtime);
        
        // Check if this is old data that shouldn't trigger approval
        const currentTime = new Date();
        const timeDiffMinutes = (currentTime - csvStats.mtime) / (1000 * 60);
        
        if (timeDiffMinutes > 5) {
          console.log('Vendor CSV file is too old (more than 5 minutes)');
          console.log('This is likely old data from a previous run - clearing old flag');
          
          // Clear the old flag file since this is stale data
          try {
            fs.unlinkSync(approvalFlagPath);
            console.log('Cleared old approval flag for stale data');
          } catch (error) {
            console.error('Error clearing old approval flag:', error);
          }
          
          return res.json({
            success: true,
            approvalNeeded: false,
            matches: []
          });
        }
        
      } catch (error) {
        console.error('Error reading vendor CSV file:', error);
      }
    }
    
    if (approvalNeeded && csvExists && csvHasContent) {
      console.log('Vendor CSV file is recent, showing approval dialog');
      
      // Parse CSV to get vendor matches
      const matches = [];
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) {
        console.log('Vendor CSV file has no data rows');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }

      // Get headers from first line
      const headerLine = lines[0];
      const headers = [];
      let currentHeader = '';
      let inQuotes = false;
      
      // Parse headers
      for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentHeader.trim());
          currentHeader = '';
        } else {
          currentHeader += char;
        }
      }
      headers.push(currentHeader.trim()); // Add last header
      
      console.log('Parsed vendor headers:', headers);
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let inFieldQuotes = false;
        
        // Parse each field
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inFieldQuotes = !inFieldQuotes;
          } else if (char === ',' && !inFieldQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim()); // Add last value
        
        // Create match object
        const match = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          // Replace newlines with spaces for display
          value = value.replace(/\n/g, ' ').replace(/\r/g, '');
          match[header] = value;
        });
        
        console.log('Parsed vendor match:', match);
        matches.push(match);
      }

      console.log('Found vendor matches:', matches.length);
      
      res.json({
        success: true,
        approvalNeeded: true,
        matches: matches
      });
    } else {
      console.log('No approval needed');
      res.json({
        success: true,
        approvalNeeded: false,
        matches: []
      });
    }
  } catch (error) {
    console.error('Error checking vendor approval status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vendor approval status'
    });
  }
});

// Check if processing is still running
app.get('/api/processing-status', async (req, res) => {
  try {
    // Check if the Python script is still running by looking for output files
    const processingCompleteFlag = path.join(__dirname, 'process', 'data', 'processed', 'processing_complete.flag');
    const isProcessingComplete = fs.existsSync(processingCompleteFlag);
    
    console.log('Processing complete flag exists:', isProcessingComplete);
    
    res.json({
      success: true,
      isProcessingComplete: isProcessingComplete,
      isStillRunning: !isProcessingComplete
    });
  } catch (error) {
    console.error('Error checking processing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check processing status'
    });
  }
});

// Check if raw_pdfs folder is empty
app.get('/api/check-raw-pdfs', async (req, res) => {
  try {
    const rawPdfsPath = path.join(__dirname, 'process', 'data', 'raw_pdfs');
    
    // Check if the directory exists
    if (!fs.existsSync(rawPdfsPath)) {
      console.log('Raw PDFs directory does not exist');
      return res.json({
        success: true,
        isEmpty: true,
        fileCount: 0
      });
    }
    
    // Get all files in the directory (excluding hidden files)
    const files = fs.readdirSync(rawPdfsPath)
      .filter(file => !file.startsWith('.') && file.endsWith('.pdf'));
    
    const isEmpty = files.length === 0;
    
    console.log(`Raw PDFs folder check: ${files.length} files found, isEmpty: ${isEmpty}`);
    
    res.json({
      success: true,
      isEmpty: isEmpty,
      fileCount: files.length
    });
  } catch (error) {
    console.error('Error checking raw PDFs folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check raw PDFs folder'
    });
  }
});

// Approve vendor matches
app.post('/api/approve-vendors', async (req, res) => {
  try {
    console.log('Received approval request:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    
    const { approvedMatches } = req.body;
    console.log('Extracted approvedMatches:', approvedMatches);
    console.log('approvedMatches type:', typeof approvedMatches);
    console.log('approvedMatches length:', approvedMatches ? approvedMatches.length : 'undefined');
    
    const approvalStatusPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'approval_status.json');
    const csvPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'matched_vendors_from_txt.csv');
    
    if (!approvedMatches || !Array.isArray(approvedMatches)) {
      console.error('Invalid approved matches data:', approvedMatches);
      return res.status(400).json({
        success: false,
        message: 'Invalid approved matches data'
      });
    }

    console.log('Writing approval status to:', approvalStatusPath);
    
    // Update approval status
    const approvalStatus = {
      approved: true,
      approved_matches: approvedMatches
    };

    fs.writeFileSync(approvalStatusPath, JSON.stringify(approvalStatus, null, 2));
    
         // Update the CSV file with the edited data
     if (approvedMatches.length > 0) {
       try {
         console.log('Updating CSV file with edited vendor data...');
         
         // Define the standard headers for vendor matches
         const standardHeaders = [
           'TXT_File',
           'Vendor_Code', 
           'Vendor_Name',
           'Vendor_Contact',
           'Vendor_Address',
           'Address_Match_Score',
           'Matched_Contact',
           'Matched_By'
         ];
         
         // Create new CSV content with updated data
         const csvLines = [];
         csvLines.push(standardHeaders.join(','));
         
         approvedMatches.forEach((match, index) => {
           console.log(`Processing match ${index}:`, match);
           console.log(`Match keys:`, Object.keys(match));
           
           const row = standardHeaders.map(header => {
             const value = match[header] || '';
             console.log(`Header "${header}": "${value}"`);
             // Escape commas and quotes in the value
             if (value.includes(',') || value.includes('"') || value.includes('\n')) {
               return `"${value.replace(/"/g, '""')}"`;
             }
             return value;
           });
           csvLines.push(row.join(','));
         });
         
         const newCsvContent = csvLines.join('\n');
         fs.writeFileSync(csvPath, newCsvContent);
         console.log('CSV file updated successfully with edited vendor data');
         console.log('New CSV content:', newCsvContent);
         
       } catch (error) {
         console.error('Error updating CSV file:', error);
         // Don't fail the request if CSV update fails
       }
     }
    
    // Clear the content hash so we don't show the same data again
    const lastContentHashPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'last_content_hash.txt');
    if (fs.existsSync(lastContentHashPath)) {
      try {
        fs.unlinkSync(lastContentHashPath);
        console.log('Cleared content hash after approval');
      } catch (error) {
        console.error('Error clearing content hash after approval:', error);
      }
    }
    
    // CRITICAL: Remove the approval flag so Python script can continue
    const approvalFlagPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'approval_needed.flag');
    if (fs.existsSync(approvalFlagPath)) {
      try {
        fs.unlinkSync(approvalFlagPath);
        console.log('Removed approval flag - Python script can now continue');
      } catch (error) {
        console.error('Error removing approval flag:', error);
      }
    } else {
      console.log('No approval flag found to remove');
    }
    
    console.log('Approval status written successfully');

    res.json({
      success: true,
      message: `Successfully approved ${approvedMatches.length} vendor matches and updated CSV file`
    });
  } catch (error) {
    console.error('Error approving vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve vendors'
    });
  }
});

// Check if PO approval is needed
app.get('/api/check-po-approval-needed', async (req, res) => {
  try {
    console.log('Checking if PO approval is needed...');
    
    const poApprovalFlagPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'po_approval_needed.flag');
    const csvPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'pixtral_po_results.csv');
    
    const poApprovalNeeded = fs.existsSync(poApprovalFlagPath);
    const csvExists = fs.existsSync(csvPath);
    
    console.log('PO Approval flag exists:', poApprovalNeeded);
    console.log('PO CSV file exists:', csvExists);
    
    if (poApprovalNeeded) {
      console.log('PO Approval flag exists - should show approval dialog');
    } else {
      console.log('No PO approval flag - no approval needed');
      return res.json({
        success: true,
        approvalNeeded: false,
        matches: []
      });
    }
    
    // Also check if the CSV file has content (not just exists)
    let csvHasContent = false;
    let csvContent = '';
    if (csvExists) {
      try {
        const csvStats = fs.statSync(csvPath);
        csvContent = fs.readFileSync(csvPath, 'utf-8');
        csvHasContent = csvContent.trim().length > 0;
        console.log('PO CSV file has content:', csvHasContent);
        console.log('PO CSV file size:', csvContent.length, 'characters');
        console.log('PO CSV file modification time:', csvStats.mtime);
      } catch (error) {
        console.error('Error reading PO CSV file:', error);
      }
    }
    
    if (poApprovalNeeded && csvExists && csvHasContent) {
      // Check if the CSV file was modified recently (within last 5 minutes)
      // This ensures we only show approval for newly created data, not old data
      const currentTime = new Date();
      const csvModTime = fs.statSync(csvPath).mtime;
      const timeDiffMinutes = (currentTime - csvModTime) / (1000 * 60);
      
      console.log('PO CSV file modification time:', csvModTime);
      console.log('Time difference (minutes):', timeDiffMinutes);
      
      // Only consider it a new approval if the file was modified within the last 5 minutes
      if (timeDiffMinutes > 5) {
        console.log('PO CSV file is too old (more than 5 minutes), not showing approval dialog');
        console.log('This is likely old data from a previous run');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }
      
      console.log('PO CSV file is recent (within 5 minutes), showing approval dialog');
      
      // Parse CSV to get PO matches
      const matches = [];
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) {
        console.log('PO CSV file has no data rows');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }

      // Get headers from first line
      const headerLine = lines[0];
      const headers = [];
      let currentHeader = '';
      let inQuotes = false;
      
      // Parse headers
      for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentHeader.trim());
          currentHeader = '';
        } else {
          currentHeader += char;
        }
      }
      headers.push(currentHeader.trim()); // Add last header
      
      console.log('Parsed PO headers:', headers);
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let inFieldQuotes = false;
        
        // Parse each field
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inFieldQuotes = !inFieldQuotes;
          } else if (char === ',' && !inFieldQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim()); // Add last value
        
        // Create match object
        const match = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          // Replace newlines with spaces for display
          value = value.replace(/\n/g, ' ').replace(/\r/g, '');
          match[header] = value;
        });
        
        console.log('Parsed PO match:', match);
        matches.push(match);
      }

      console.log('Found PO matches:', matches.length);
      
      res.json({
        success: true,
        approvalNeeded: true,
        matches: matches
      });
    } else {
      res.json({
        success: true,
        approvalNeeded: false,
        matches: []
      });
    }
  } catch (error) {
    console.error('Error checking PO approval status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check PO approval status'
    });
  }
});

// Approve PO matches
app.post('/api/approve-po-matches', async (req, res) => {
  try {
    console.log('PO approval request received');
    const { approvedMatches } = req.body;
    
    if (!approvedMatches || !Array.isArray(approvedMatches)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approved PO matches data'
      });
    }
    
    console.log('Approved PO matches:', approvedMatches);
    
    // Update the pixtral_po_results.csv file with edited data
    const poResultsPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'pixtral_po_results.csv');
    
    if (fs.existsSync(poResultsPath)) {
      // Read the current CSV file
      const csvContent = fs.readFileSync(poResultsPath, 'utf8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      console.log('PO CSV Headers:', headers);
      console.log('Number of lines in CSV:', lines.length);
      
      // Create a map of file_name to edited data
      const editedDataMap = new Map();
      approvedMatches.forEach(match => {
        if (match.file_name) {
          editedDataMap.set(match.file_name, {
            PO_Number: match.PO_Number || '',
            Job_Number: match.Job_Number || '',
            WO_Number: match.WO_Number || '',
            Remarks: match.Remarks || ''
          });
        }
      });
      
      console.log('Edited data map:', editedDataMap);
      
      // Update the CSV lines with edited data
      const updatedLines = lines.map((line, index) => {
        if (index === 0) return line; // Keep header line
        
        const values = line.split(',').map(v => v.trim());
        if (values.length < headers.length) return line; // Skip malformed lines
        
        const fileName = values[headers.indexOf('file_name')];
        if (fileName && editedDataMap.has(fileName)) {
          const editedData = editedDataMap.get(fileName);
          console.log(`Updating line for file: ${fileName}`, editedData);
          
          // Update the specific columns
          const updatedValues = [...values];
          const poNumberIndex = headers.indexOf('PO_Number');
          const jobNumberIndex = headers.indexOf('Job_Number');
          const woNumberIndex = headers.indexOf('WO_Number');
          const remarksIndex = headers.indexOf('Remarks');
          
          if (poNumberIndex !== -1) updatedValues[poNumberIndex] = `"${editedData.PO_Number}"`;
          if (jobNumberIndex !== -1) updatedValues[jobNumberIndex] = `"${editedData.Job_Number}"`;
          if (woNumberIndex !== -1) updatedValues[woNumberIndex] = `"${editedData.WO_Number}"`;
          if (remarksIndex !== -1) updatedValues[remarksIndex] = `"${editedData.Remarks}"`;
          
          return updatedValues.join(',');
        }
        
        return line;
      });
      
      // Write the updated CSV back to file
      const updatedCsvContent = updatedLines.join('\n');
      fs.writeFileSync(poResultsPath, updatedCsvContent, 'utf8');
      
      console.log('Updated pixtral_po_results.csv with edited PO data');
    }
    
    // Remove the approval flag to indicate approval is complete
    const poApprovalFlagPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'po_approval_needed.flag');
    const lastPOContentHashPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'last_po_content_hash.txt');
    
    if (fs.existsSync(poApprovalFlagPath)) {
      fs.unlinkSync(poApprovalFlagPath);
      console.log('Removed PO approval flag');
    }
    
    // Clear the content hash to allow fresh data for next processing
    if (fs.existsSync(lastPOContentHashPath)) {
      fs.unlinkSync(lastPOContentHashPath);
      console.log('Cleared PO content hash file');
    }
    
    res.json({
      success: true,
      message: 'PO matches approved and updated successfully'
    });
  } catch (error) {
    console.error('Error approving PO matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve PO matches'
    });
  }
});

// Get processed invoices from final_invoice_data.xlsx
app.get('/api/invoices', (req, res) => {
  try {
    console.log('Fetching processed invoices from final_invoice_data.xlsx...');
    
    const filePath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'final_invoice_data.xlsx');
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('final_invoice_data.xlsx not found at:', filePath);
      return res.json({
        success: true,
        invoices: [],
        message: 'No processed invoices found. Please process invoices first.'
      });
    }

    console.log('File found, reading Excel file...');
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('Sheet name:', sheetName);
    console.log('Available sheets:', workbook.SheetNames);
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Raw data length:', rawData.length);
    console.log('First row (headers):', rawData[0]);
    console.log('Second row (sample data):', rawData[1]);
    
    if (rawData.length < 2) {
      console.log('Not enough data rows found');
      return res.json({
        success: true,
        invoices: [],
        message: 'No invoice data found in the Excel file'
      });
    }

    // Get headers from first row
    const headers = rawData[0];
    const dataRows = rawData.slice(1);
    
    console.log('Headers found:', headers);
    console.log('Number of data rows:', dataRows.length);

    // Map the data to the expected format
    const invoices = dataRows.map((row, index) => {
      const invoice = {
        id: (index + 1).toString(),
        invoiceNumber: '',
        vendorCode: '',
        vendorName: '',
        invoiceType: '',
        poNumber: '',
        jobNumber: '',
        woNumber: '',
        remarks: '',
        invoiceDate: '',
        invoiceAmount: '',
        taxAmount: '',
        shippingCharges: '',
        amountBeforeTaxes: '',
        distributionGLAccount: '',
        phaseCode: '',
        costType: ''
      };

      // Map columns based on the headers you specified
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || '';
        
        switch (header) {
          case 'Invoice_Number':
            invoice.invoiceNumber = value.toString();
            break;
          case 'Vendor_Code':
            invoice.vendorCode = value.toString();
            break;
          case 'Vendor_Name':
            invoice.vendorName = value.toString();
            break;
          case 'Invoice_Type':
            invoice.invoiceType = value ? value.toString() : '';
            break;
          case 'PO_Number':
            invoice.poNumber = value ? value.toString() : '';
            break;
          case 'Job_Number':
            invoice.jobNumber = value ? value.toString() : '';
            break;
          case 'WO_Number':
            invoice.woNumber = value ? value.toString() : '';
            break;
          case 'Remarks':
            invoice.remarks = value ? value.toString() : '';
            break;
          case 'Invoice_Date':
            invoice.invoiceDate = value ? value.toString() : '';
            break;
          case 'Invoice_Amount':
            invoice.invoiceAmount = value ? value.toString() : '0.00';
            break;
          case 'Tax_Amount':
            invoice.taxAmount = value ? value.toString() : '0.00';
            break;
          case 'Shipping_Charges':
            invoice.shippingCharges = value ? value.toString() : '0.00';
            break;
          case 'Amount_Before_Taxes':
            invoice.amountBeforeTaxes = value ? value.toString() : '0.00';
            break;
          case 'Distribution_GL_Account':
            invoice.distributionGLAccount = value ? value.toString() : '';
            break;
          case 'Phase_Code':
            invoice.phaseCode = value ? value.toString() : '';
            break;
          case 'Cost_Type':
            invoice.costType = value ? value.toString() : '';
            break;
          default:
            // For any other columns, we might want to handle them
            console.log('Unhandled column:', header, 'with value:', value);
            break;
        }
      });

      // Set vendor name based on vendor code if not provided
      if (!invoice.vendorName && invoice.vendorCode) {
        invoice.vendorName = invoice.vendorCode;
      }

      console.log('Processed invoice:', invoice);
      return invoice;
    });

    console.log(`Returning ${invoices.length} invoices from Excel file`);
    
    res.json({
      success: true,
      invoices: invoices,
      message: `Found ${invoices.length} processed invoices`
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processed invoices',
      error: error.message
    });
  }
});

// Get PDF file for thumbnail generation
app.get('/api/pdf-file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
    
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: 'File is not a PDF'
      });
    }
    
    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the PDF file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF file',
      error: error.message
    });
  }
});

// Get split PDF file for thumbnail generation
app.get('/api/split-pdf-file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'split_pages', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Split PDF file not found'
      });
    }

    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: 'File is not a PDF'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving split PDF file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve split PDF file',
      error: error.message
    });
  }
});

// Get PDF page information
app.get('/api/pdf-pages', async (req, res) => {
  try {
    console.log('Getting PDF page information...');
    
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'))
      .filter(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return stats.isFile() && file.toLowerCase().endsWith('.pdf');
      });
    
    const pdfInfo = [];
    
    for (const filename of files) {
      try {
        const filePath = path.join(uploadsDir, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const pageCount = pdfDoc.getPageCount();
        
        pdfInfo.push({
          filename,
          pageCount,
          path: filePath
        });
        
        console.log(`PDF ${filename}: ${pageCount} pages`);
      } catch (error) {
        console.error(`Error reading PDF ${filename}:`, error);
        // If we can't read the PDF, we'll skip it
        continue;
      }
    }
    
    console.log(`Found ${pdfInfo.length} PDF files with page information`);
    
    res.json({
      success: true,
      pdfFiles: pdfInfo,
      message: `Found ${pdfInfo.length} PDF file(s)`
    });
  } catch (error) {
    console.error('Error getting PDF page information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PDF page information',
      error: error.message
    });
  }
});

// Split PDF pages into individual files
app.post('/api/split-pdf-pages', async (req, res) => {
  try {
    console.log('Splitting PDF pages into individual files...');
    
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'))
      .filter(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return stats.isFile() && file.toLowerCase().endsWith('.pdf');
      });
    
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No PDF files found to split'
      });
    }
    
    const splitFiles = [];
    
    for (const filename of files) {
      try {
        const filePath = path.join(uploadsDir, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const pageCount = pdfDoc.getPageCount();
        
        console.log(`Processing PDF ${filename} with ${pageCount} pages`);
        
        // Create a directory for split pages if it doesn't exist
        const splitDir = path.join(__dirname, 'split_pages');
        if (!fs.existsSync(splitDir)) {
          fs.mkdirSync(splitDir, { recursive: true });
        }
        
        // Split each page into individual PDF files
        for (let i = 0; i < pageCount; i++) {
          const newPdfDoc = await PDFDocument.create();
          const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
          newPdfDoc.addPage(page);
          
          // Generate filename for the split page
          const nameWithoutExt = path.basename(filename, '.pdf');
          const splitFilename = `${nameWithoutExt}_page_${i + 1}.pdf`;
          const splitFilePath = path.join(splitDir, splitFilename);
          
          // Save the split page
          const pdfBytes = await newPdfDoc.save();
          fs.writeFileSync(splitFilePath, pdfBytes);
          
          splitFiles.push(splitFilename);
          console.log(`Created split page: ${splitFilename}`);
        }
        
        console.log(`Successfully split ${filename} into ${pageCount} individual pages`);
        
      } catch (error) {
        console.error(`Error splitting PDF ${filename}:`, error);
        // Continue with other files even if one fails
        continue;
      }
    }
    
    if (splitFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to split any PDF pages'
      });
    }
    
    console.log(`Successfully split ${splitFiles.length} pages from ${files.length} PDF files`);
    
    res.json({
      success: true,
      message: `Successfully split ${splitFiles.length} pages from ${files.length} PDF file(s)`,
      splitFiles: splitFiles
    });
    
  } catch (error) {
    console.error('Error splitting PDF pages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to split PDF pages',
      error: error.message
    });
  }
});

// Create manual split PDFs with custom page groups
app.post('/api/create-manual-split-pdfs', async (req, res) => {
  try {
    const { groups } = req.body;
    console.log('Creating manual split PDFs with groups:', groups);
    
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid groups data provided'
      });
    }
    
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'))
      .filter(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return stats.isFile() && file.toLowerCase().endsWith('.pdf');
      });
    
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No PDF files found to split'
      });
    }
    
    const splitFiles = [];
    
    for (const filename of files) {
      try {
        const filePath = path.join(uploadsDir, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const totalPages = pdfDoc.getPageCount();
        
        console.log(`Processing PDF ${filename} with ${totalPages} pages for manual split`);
        
        // Create a directory for manual split pages if it doesn't exist
        const splitDir = path.join(__dirname, 'split_pages');
        if (!fs.existsSync(splitDir)) {
          fs.mkdirSync(splitDir, { recursive: true });
        }
        
        // Create PDFs for each group
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const newPdfDoc = await PDFDocument.create();
          
          // Add pages for this group (adjust for 0-based indexing)
          for (let pageNum = group.start - 1; pageNum < group.end; pageNum++) {
            if (pageNum < totalPages) {
              const [page] = await newPdfDoc.copyPages(pdfDoc, [pageNum]);
              newPdfDoc.addPage(page);
            }
          }
          
          // Generate filename for the group
          const nameWithoutExt = path.basename(filename, '.pdf');
          const groupFilename = `${nameWithoutExt}_group_${i + 1}_pages_${group.start}-${group.end}.pdf`;
          const groupFilePath = path.join(splitDir, groupFilename);
          
          // Save the group PDF
          const pdfBytes = await newPdfDoc.save();
          fs.writeFileSync(groupFilePath, pdfBytes);
          
          splitFiles.push(groupFilename);
          console.log(`Created manual split group: ${groupFilename}`);
        }
        
        console.log(`Successfully created ${groups.length} manual split groups for ${filename}`);
        
      } catch (error) {
        console.error(`Error creating manual split for ${filename}:`, error);
        continue;
      }
    }
    
    if (splitFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create any manual split PDFs'
      });
    }
    
    console.log(`Successfully created ${splitFiles.length} manual split PDFs`);
    
    res.json({
      success: true,
      message: `Successfully created ${splitFiles.length} manual split PDFs`,
      splitFiles: splitFiles
    });
    
  } catch (error) {
    console.error('Error creating manual split PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create manual split PDFs',
      error: error.message
    });
  }
});

// Export split PDFs to uploads folder
app.post('/api/export-split-pdfs', async (req, res) => {
  try {
    console.log('Exporting split PDFs to uploads folder...');
    
    const splitDir = path.join(__dirname, 'split_pages');
    if (!fs.existsSync(splitDir)) {
      return res.status(400).json({
        success: false,
        message: 'No split pages found. Please split PDFs first.'
      });
    }
    
    const splitFiles = fs.readdirSync(splitDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'))
      .filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (splitFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No split PDF files found to export'
      });
    }
    
    // Clear uploads folder (except .gitkeep)
    const uploadFiles = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'));
    
    for (const file of uploadFiles) {
      const filePath = path.join(uploadsDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${file}`);
      }
    }
    
    // Move split files to uploads folder (instead of copying)
    const exportedFiles = [];
    for (const filename of splitFiles) {
      try {
        const sourcePath = path.join(splitDir, filename);
        const destPath = path.join(uploadsDir, filename);
        
        // Move the file (rename) instead of copying
        fs.renameSync(sourcePath, destPath);
        exportedFiles.push(filename);
        console.log(`Moved: ${filename}`);
      } catch (error) {
        console.error(`Error moving ${filename}:`, error);
        continue;
      }
    }
    
    if (exportedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to export any split PDFs'
      });
    }
    
    console.log(`Successfully moved ${exportedFiles.length} split PDFs to uploads folder`);
    
    res.json({
      success: true,
      message: `Successfully moved ${exportedFiles.length} split PDFs to uploads folder`,
      exportedFiles: exportedFiles
    });
    
  } catch (error) {
    console.error('Error exporting split PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export split PDFs',
      error: error.message
    });
  }
});

// Export grouped PDFs to uploads folder
app.post('/api/export-grouped-pdfs', async (req, res) => {
  try {
    console.log('Exporting grouped PDFs to uploads folder...');
    
    const { pageGroups } = req.body;
    
    if (!pageGroups || !Array.isArray(pageGroups)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page groups data'
      });
    }
    
    const splitDir = path.join(__dirname, 'split_pages');
    if (!fs.existsSync(splitDir)) {
      return res.status(400).json({
        success: false,
        message: 'No split pages found. Please split PDFs first.'
      });
    }
    
    // Clear uploads folder (except .gitkeep)
    const uploadFiles = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'));
    
    for (const file of uploadFiles) {
      const filePath = path.join(uploadsDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${file}`);
      }
    }
    
    const exportedFiles = [];
    
    // Get the actual split files to determine the filename pattern
    const splitFiles = fs.readdirSync(splitDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'))
      .filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (splitFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No split PDF files found to export'
      });
    }
    
    // Extract filename pattern from the first file
    const firstFile = splitFiles[0];
    const filenameMatch = firstFile.match(/^(.+)_page_(\d+)\.pdf$/);
    if (!filenameMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format for split pages'
      });
    }
    
    const baseFilename = filenameMatch[1];
    
    // Process each group
    for (let groupIndex = 0; groupIndex < pageGroups.length; groupIndex++) {
      const group = pageGroups[groupIndex];
      
      if (group.length === 1) {
        // Single page - just move the file
        const pageNumber = group[0];
        const filename = `${baseFilename}_page_${pageNumber}.pdf`;
        const sourcePath = path.join(splitDir, filename);
        const destPath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(sourcePath)) {
          fs.renameSync(sourcePath, destPath);
          exportedFiles.push(filename);
          console.log(`Moved single page: ${filename}`);
        }
      } else {
        // Multiple pages - merge them into one PDF
        const groupFilename = `Group_${groupIndex + 1}_Pages_${group[0]}-${group[group.length - 1]}.pdf`;
        const destPath = path.join(uploadsDir, groupFilename);
        
        try {
          // Create a new PDF document
          const mergedPdf = await PDFDocument.create();
          
          // Add each page from the group
          for (const pageNumber of group) {
            const filename = `${baseFilename}_page_${pageNumber}.pdf`;
            const sourcePath = path.join(splitDir, filename);
            
            if (fs.existsSync(sourcePath)) {
              const pdfBytes = fs.readFileSync(sourcePath);
              const pdf = await PDFDocument.load(pdfBytes);
              const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
              pages.forEach(page => mergedPdf.addPage(page));
            }
          }
          
          // Save the merged PDF
          const mergedPdfBytes = await mergedPdf.save();
          fs.writeFileSync(destPath, mergedPdfBytes);
          
          exportedFiles.push(groupFilename);
          console.log(`Created merged PDF: ${groupFilename}`);
          
          // Remove the individual page files from split_pages
          for (const pageNumber of group) {
            const filename = `${baseFilename}_page_${pageNumber}.pdf`;
            const sourcePath = path.join(splitDir, filename);
            if (fs.existsSync(sourcePath)) {
              fs.unlinkSync(sourcePath);
            }
          }
        } catch (error) {
          console.error(`Error merging group ${groupIndex + 1}:`, error);
          continue;
        }
      }
    }
    
    if (exportedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to export any grouped PDFs'
      });
    }
    
    console.log(`Successfully exported ${exportedFiles.length} grouped PDFs to uploads folder`);
    
    res.json({
      success: true,
      message: `Successfully exported ${exportedFiles.length} grouped PDFs to uploads folder`,
      exportedFiles: exportedFiles
    });
    
  } catch (error) {
    console.error('Error exporting grouped PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export grouped PDFs',
      error: error.message
    });
  }
});

// Clear all folders endpoint
app.post('/api/clear-all-folders', (req, res) => {
  try {
    const foldersToClear = [
      uploadsDir,
      path.join(__dirname, 'split_pages'),
      path.join(__dirname, 'manual_split_pages')
    ];
    
    const clearedFolders = [];
    
    foldersToClear.forEach(folderPath => {
      if (fs.existsSync(folderPath)) {
        try {
          const files = fs.readdirSync(folderPath);
          files.forEach(file => {
            if (file !== '.gitkeep') { // Preserve .gitkeep files
              const filePath = path.join(folderPath, file);
              if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
              }
            }
          });
          clearedFolders.push(path.basename(folderPath));
        } catch (error) {
          console.error(`Error clearing folder ${folderPath}:`, error);
        }
      }
    });
    
    res.json({
      success: true,
      message: `Successfully cleared ${clearedFolders.length} folders`,
      clearedFolders
    });
  } catch (error) {
    console.error('Error clearing all folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear folders'
    });
  }
});

// Check if uploads folder is empty
app.get('/api/check-uploads-folder', (req, res) => {
  try {
    console.log('Checking uploads folder status...');
    
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file !== '.gitkeep' && !file.startsWith('.'))
      .filter(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return stats.isFile();
      });
    
    const fileCount = files.length;
    const isEmpty = fileCount === 0;
    
    console.log('Uploads folder file count:', fileCount);
    console.log('Uploads folder is empty:', isEmpty);
    
    res.json({
      success: true,
      isEmpty: isEmpty,
      fileCount: fileCount,
      message: isEmpty ? 'Uploads folder is empty' : `Found ${fileCount} file(s) in uploads folder`
    });
  } catch (error) {
    console.error('Error checking uploads folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check uploads folder status'
    });
  }
});

// Store extracted invoices in memory for display
let extractedInvoices = [];

// Email monitoring service
class EmailMonitor {
  constructor() {
    // Load environment variables
    this.emailConfig = {
      user: process.env.EMAIL_USER || 'fetcherinvoice@gmail.com',
      password: process.env.EMAIL_PASSWORD || 'your-app-password',
      host: process.env.EMAIL_HOST || 'imap.gmail.com',
      port: process.env.EMAIL_PORT || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
    
    console.log('Email config loaded:', {
      user: this.emailConfig.user,
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      hasPassword: !!this.emailConfig.password
    });
    
    this.imap = new Imap(this.emailConfig);
    this.isMonitoring = false;
    this.checkInterval = null;
  }

  start() {
    if (this.isMonitoring) return;
    
    console.log('Starting email monitoring...');
    this.isMonitoring = true;
    
    // Check emails every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkForNewEmails();
    }, 5 * 60 * 1000);
    
    // Initial check
    this.checkForNewEmails();
  }

  stop() {
    if (!this.isMonitoring) return;
    
    console.log('Stopping email monitoring...');
    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkForNewEmails() {
    try {
      await this.connectAndProcess();
    } catch (error) {
      console.error('Email monitoring error:', error);
    }
  }

  async connectAndProcess() {
    return new Promise((resolve, reject) => {
      console.log('Attempting to connect to IMAP server...');
      console.log('Using config:', {
        user: this.emailConfig.user,
        host: this.emailConfig.host,
        port: this.emailConfig.port,
        hasPassword: !!this.emailConfig.password
      });
      
      this.imap.once('ready', () => {
        console.log('IMAP connection established successfully!');
        this.openInbox((err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            reject(err);
            return;
          }
          
          console.log('Connected to inbox, searching for emails...');
          
          // Search for emails from raj2511tandel@gmail.com from last 24 hours (including seen emails)
          const yesterday = new Date();
          yesterday.setTime(yesterday.getTime() - 24 * 3600 * 1000);
          
          console.log('Searching for emails since:', yesterday.toISOString());
          console.log('Looking for emails FROM: raj2511tandel@gmail.com');
          
          // Remove UNSEEN filter to get all emails from the sender
          this.imap.search([['SINCE', yesterday], ['FROM', 'raj2511tandel@gmail.com']], (err, results) => {
            if (err) {
              console.error('Search error:', err);
              reject(err);
              return;
            }
            
            console.log(`Search results: Found ${results.length} emails from raj2511tandel@gmail.com`);
            
            if (results.length === 0) {
              console.log('No emails from raj2511tandel@gmail.com found in last 24 hours');
              this.imap.end();
              resolve();
              return;
            }
            
            console.log(`Processing ${results.length} emails from raj2511tandel@gmail.com`);
            this.processEmails(results);
          });
        });
      });

      this.imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        console.error('Error details:', {
          type: err.type,
          textCode: err.textCode,
          source: err.source,
          message: err.message
        });
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('IMAP connection ended');
        resolve();
      });

      console.log('Connecting to IMAP server...');
      this.imap.connect();
    });
  }

  openInbox(cb) {
    this.imap.openBox('INBOX', false, cb);
  }

  processEmails(emailIds) {
    let processedCount = 0;
    
    console.log(`Processing ${emailIds.length} emails...`);
    
    emailIds.forEach((id) => {
      console.log(`Fetching email ID: ${id}`);
      
      try {
        const fetch = this.imap.fetch(id, { 
          bodies: ['HEADER', 'TEXT'],
          struct: true 
        });

        fetch.on('message', (msg, seqno) => {
          console.log(`Processing message ${seqno}`);
          let buffer = '';
          let headerBuffer = '';
          
          msg.on('body', (stream, info) => {
            console.log(`Body stream: ${info.which}`);
            if (info.which === 'TEXT') {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            } else if (info.which === 'HEADER') {
              stream.on('data', (chunk) => {
                headerBuffer += chunk.toString('utf8');
              });
            }
          });

          msg.once('attributes', (attrs) => {
            console.log(`Message attributes received for ID: ${id}`);
            console.log(`Full attributes:`, JSON.stringify(attrs, null, 2));
            
            // Check if message has attachments
            if (attrs.struct) {
              console.log(`Message has structure, checking for attachments...`);
              this.processMessageStructure(attrs.struct, id, buffer, headerBuffer);
            } else {
              console.log(`No structure found, processing as text only`);
              this.processEmailContent(buffer, headerBuffer, null, null, id);
            }
          });

          msg.once('end', () => {
            console.log(`Message ${seqno} processing completed`);
            processedCount++;
            
            if (processedCount === emailIds.length) {
              console.log('All emails processed, ending IMAP connection');
              this.imap.end();
            }
          });
        });

        fetch.once('error', (err) => {
          console.error(`Fetch error for email ID ${id}:`, err);
          processedCount++;
          
          if (processedCount === emailIds.length) {
            console.log('All emails processed (with errors), ending IMAP connection');
            this.imap.end();
          }
        });
      } catch (error) {
        console.error(`Error setting up fetch for email ID ${id}:`, error);
        processedCount++;
        
        if (processedCount === emailIds.length) {
          console.log('All emails processed (with errors), ending IMAP connection');
          this.imap.end();
        }
      }
    });
  }

  processMessageStructure(struct, emailId, emailText, headerBuffer) {
    try {
      console.log(`Processing message structure for email ID: ${emailId}`);
      
      // Recursively find attachments in the structure
      const attachments = this.findAttachments(struct);
      console.log(`Found ${attachments.length} attachments`);
      
      if (attachments.length > 0) {
        // Process each attachment
        attachments.forEach((attachment, index) => {
          console.log(`Processing attachment ${index + 1}: ${attachment.subtype}`);
          this.fetchAttachment(attachment, emailId, emailText, headerBuffer);
        });
      } else {
        // No attachments, process as text only
        this.processEmailContent(emailText, headerBuffer, null, null, emailId);
      }
    } catch (error) {
      console.error(`Error processing message structure:`, error);
      this.processEmailContent(emailText, headerBuffer, null, null, emailId);
    }
  }

  findAttachments(struct) {
    const attachments = [];
    
    console.log(`Analyzing structure for attachments:`, JSON.stringify(struct, null, 2));
    
    // Handle Gmail's complex structure - struct is an array, not an object
    if (Array.isArray(struct)) {
      console.log(`Gmail array structure detected, processing each part`);
      struct.forEach((part, index) => {
        console.log(`Processing part ${index}:`, {
          type: part.type,
          subtype: part.subtype,
          disposition: part.disposition,
          partID: part.partID
        });
        
        // Check if this part is an attachment
        if (part.disposition && part.disposition.type === 'ATTACHMENT') {
          console.log(`Found explicit attachment in part ${index}: ${part.subtype}`);
          attachments.push(part);
        }
        // Check for inline files
        else if (part.subtype && ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(part.subtype.toLowerCase())) {
          console.log(`Found inline file in part ${index}: ${part.subtype}`);
          attachments.push(part);
        }
        // Check for nested structures
        else if (Array.isArray(part)) {
          console.log(`Nested array in part ${index}, searching deeper`);
          const nestedAttachments = this.findAttachments(part);
          attachments.push(...nestedAttachments);
        }
        // Check for nested objects
        else if (part && typeof part === 'object' && part.parts) {
          console.log(`Nested object with parts in part ${index}, searching deeper`);
          const nestedAttachments = this.findAttachments(part.parts);
          attachments.push(...nestedAttachments);
        }
      });
    }
    // Handle traditional object structure
    else if (struct && typeof struct === 'object') {
      // Handle multipart messages (most common for emails with files)
      if (struct.subtype && struct.subtype.toLowerCase() === 'mixed') {
        console.log(`Multipart mixed message detected`);
        if (struct.parts) {
          struct.parts.forEach((part, index) => {
            console.log(`Part ${index}:`, {
              subtype: part.subtype,
              disposition: part.disposition,
              type: part.type
            });
            
            // Check for explicit attachments
            if (part.disposition && part.disposition.type === 'attachment') {
              console.log(`Found explicit attachment in part ${index}`);
              attachments.push(part);
            }
            // Check for inline images/PDFs
            else if (part.subtype && ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(part.subtype.toLowerCase())) {
              console.log(`Found inline file in part ${index}: ${part.subtype}`);
              attachments.push(part);
            }
            // Check for nested multipart (Gmail often does this)
            else if (part.subtype && part.subtype.toLowerCase() === 'related' && part.parts) {
              console.log(`Found nested multipart in part ${index}, searching deeper`);
              part.parts.forEach((nestedPart, nestedIndex) => {
                console.log(`Nested part ${nestedIndex}:`, {
                  subtype: nestedPart.subtype,
                  disposition: nestedPart.disposition,
                  type: nestedPart.type
                });
                
                if (nestedPart.subtype && ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(nestedPart.subtype.toLowerCase())) {
                  console.log(`Found file in nested part ${nestedIndex}: ${nestedPart.subtype}`);
                  attachments.push(nestedPart);
                }
              });
            }
          });
        }
      } 
      // Handle single attachment
      else if (struct.disposition && struct.disposition.type === 'attachment') {
        console.log(`Single attachment detected:`, struct);
        attachments.push(struct);
      }
      // Handle inline images/PDFs in simple messages
      else if (struct.subtype && ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(struct.subtype.toLowerCase())) {
        console.log(`Inline file detected:`, struct);
        attachments.push(struct);
      }
      // Handle nested multipart (Gmail's complex structure)
      else if (struct.parts) {
        console.log(`Nested multipart detected, searching recursively`);
        struct.parts.forEach(part => {
          const nestedAttachments = this.findAttachments(part);
          attachments.push(...nestedAttachments);
        });
      }
    }
    
    console.log(`Total attachments found: ${attachments.length}`);
    return attachments;
  }

  fetchAttachment(attachment, emailId, emailText, headerBuffer) {
    try {
      console.log(`Fetching attachment: ${attachment.subtype}`);
      console.log(`Attachment details:`, {
        partID: attachment.partID,
        type: attachment.type,
        subtype: attachment.subtype,
        size: attachment.size
      });
      
      // Use the correct part ID for fetching
      const partId = attachment.partID || '2';
      console.log(`Using part ID: ${partId} for fetching`);
      
      const fetch = this.imap.fetch(emailId, { 
        bodies: [partId],
        struct: false  // Don't fetch structure again
      });

      fetch.on('message', (msg, seqno) => {
        console.log(`Processing attachment message ${seqno}`);
        let attachmentData = null;
        
        msg.on('body', (stream, info) => {
          console.log(`Attachment body stream: ${info.which}`);
          if (info.which === partId) {
            const chunks = [];
            stream.on('data', (chunk) => {
              chunks.push(chunk);
            });
            stream.on('end', () => {
              attachmentData = Buffer.concat(chunks);
              console.log(`Attachment data received: ${attachmentData.length} bytes`);
              
              // Process the attachment
              this.processEmailContent(emailText, headerBuffer, attachment, attachmentData, emailId);
            });
          }
        });

        msg.once('end', () => {
          console.log(`Attachment fetch completed for email ID: ${emailId}`);
        });
      });

      fetch.once('error', (err) => {
        console.error(`Error fetching attachment:`, err);
        // Process email without attachment
        this.processEmailContent(emailText, headerBuffer, null, null, emailId);
      });
    } catch (error) {
      console.error(`Error setting up attachment fetch:`, error);
      // Process email without attachment
      this.processEmailContent(emailText, headerBuffer, null, null, emailId);
    }
  }

  async processEmailContent(emailText, headerBuffer, attachment, attachmentData, emailId) {
    try {
      console.log(`Processing email ID: ${emailId}`);
      console.log(`Has attachment: ${!!attachment}`);
      console.log(`Has attachmentData: ${!!attachmentData}`);
      
      // Parse email content - combine text and headers
      let fullEmailContent = '';
      if (headerBuffer) {
        fullEmailContent += headerBuffer + '\n\n';
      }
      if (emailText) {
        fullEmailContent += emailText;
      }
      
      console.log(`Full email content length: ${fullEmailContent.length}`);
      
      // Parse email content
      const parsed = await simpleParser(fullEmailContent);
      console.log(`Email subject: ${parsed.subject}`);
      console.log(`Email from: ${parsed.from?.text}`);
      
      // Always process attachments from raj2511tandel@gmail.com
      if (attachment && attachmentData) {
        console.log(`Processing email from raj2511tandel@gmail.com: ${parsed.subject}`);
        
        // Get attachment details
        const attachmentName = attachment.disposition?.params?.filename || `attachment_${Date.now()}`;
        const attachmentType = attachment.subtype || 'unknown';
        
        console.log(`Attachment name: ${attachmentName}`);
        console.log(`Attachment type: ${attachmentType}`);
        console.log(`Attachment size: ${attachmentData.length} bytes`);
        
        // Save attachment to a new folder for email attachments (not uploads)
        try {
          const fs = await import('fs');
          const path = await import('path');
          
          // Save to email_attachments folder instead of uploads
          const emailAttachmentsDir = path.join(process.cwd(), 'email_attachments');
          if (!fs.existsSync(emailAttachmentsDir)) {
            fs.mkdirSync(emailAttachmentsDir, { recursive: true });
          }
          const emailAttachmentPath = path.join(emailAttachmentsDir, attachmentName);
          fs.writeFileSync(emailAttachmentPath, attachmentData);
          console.log(`Saved email attachment to email_attachments folder: ${emailAttachmentPath}`);
          
        } catch (saveError) {
          console.error(`Error saving email attachment to file:`, saveError);
        }
        
        // Convert attachment to base64 for display
        const base64Attachment = attachmentData.toString('base64');
        
        // Create invoice object for display
        const invoiceData = {
          id: `email_${emailId}_${Date.now()}`,
          emailSubject: parsed.subject || 'No Subject',
          emailFrom: parsed.from?.text || 'raj2511tandel@gmail.com',
          emailDate: parsed.date || new Date(),
          attachmentName: attachmentName,
          attachmentType: attachmentType,
          attachmentData: base64Attachment,
          mimeType: `application/${attachmentType}`,
          isImage: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(attachmentType.toLowerCase()),
          isPDF: attachmentType.toLowerCase() === 'pdf',
          filePath: `email_attachments/${attachmentName}`,
          status: 'pending_approval' // Mark as pending until moved to uploads
        };
        
        // Add to extracted invoices list
        extractedInvoices.unshift(invoiceData);
        
        // Keep only last 50 invoices to prevent memory issues
        if (extractedInvoices.length > 50) {
          extractedInvoices = extractedInvoices.slice(0, 50);
        }
        
        console.log(`Added invoice: ${attachmentName} to display list. Total invoices: ${extractedInvoices.length}`);
        
        // Mark email as read
        this.markAsRead(emailId);
      } else {
        console.log(`No attachment found in email ID: ${emailId}`);
        if (!attachment) console.log('Attachment is null/undefined');
        if (!attachmentData) console.log('AttachmentData is null/undefined');
      }
    } catch (error) {
      console.error('Error processing email:', error);
    }
  }

  markAsRead(emailId) {
    this.imap.addFlags(emailId, ['\\Seen'], (err) => {
      if (err) {
        console.error('Error marking email as read:', err);
      }
    });
  }
}

// Initialize email monitor
const emailMonitor = new EmailMonitor();

// Email monitoring endpoints
app.post('/api/email-monitor/start', (req, res) => {
  try {
    emailMonitor.start();
    res.json({
      success: true,
      message: 'Email monitoring started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start email monitoring',
      error: error.message
    });
  }
});

app.post('/api/email-monitor/stop', (req, res) => {
  try {
    emailMonitor.stop();
    res.json({
      success: true,
      message: 'Email monitoring stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop email monitoring',
      error: error.message
    });
  }
});

app.get('/api/email-monitor/status', (req, res) => {
  try {
    res.json({
      success: true,
      isMonitoring: emailMonitor.isMonitoring,
      message: emailMonitor.isMonitoring ? 'Email monitoring is active' : 'Email monitoring is inactive'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get email monitoring status',
      error: error.message
    });
  }
});

// Get extracted invoices for display
app.get('/api/email-monitor/invoices', (req, res) => {
  try {
    res.json({
      success: true,
      invoices: extractedInvoices,
      count: extractedInvoices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get extracted invoices',
      error: error.message
    });
  }
});

// Debug endpoint to check environment variables
app.get('/api/email-monitor/debug', (req, res) => {
  try {
    res.json({
      success: true,
      env: {
        EMAIL_USER: process.env.EMAIL_USER || 'NOT_SET',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT_SET',
        EMAIL_HOST: process.env.EMAIL_HOST || 'NOT_SET',
        EMAIL_PORT: process.env.EMAIL_PORT || 'NOT_SET'
      },
      message: 'Environment variables check'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check environment variables',
      error: error.message
    });
  }
});

// Manual trigger to check emails immediately (for testing)
app.post('/api/email-monitor/check-now', (req, res) => {
  try {
    console.log('Manual email check triggered');
    emailMonitor.checkForNewEmails();
    res.json({
      success: true,
      message: 'Manual email check triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual email check',
      error: error.message
    });
  }
});

// Clear extracted invoices
app.delete('/api/email-monitor/invoices', (req, res) => {
  try {
    console.log('Clearing email attachments folder...');
    
    const emailAttachmentsDir = path.join(__dirname, 'email_attachments');
    
    if (!fs.existsSync(emailAttachmentsDir)) {
      return res.json({
        success: true,
        message: 'Email attachments folder does not exist',
        clearedFiles: 0
      });
    }
    
    // Get all files in email_attachments folder
    const files = fs.readdirSync(emailAttachmentsDir)
      .filter(file => !file.startsWith('.') && (file.endsWith('.pdf') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')));
    
    console.log(`Found ${files.length} email attachments to clear`);
    
    if (files.length === 0) {
      return res.json({
        success: true,
        message: 'No email attachments found to clear',
        clearedFiles: 0
      });
    }
    
    // Delete all files from email_attachments folder
    let clearedFiles = 0;
    files.forEach(file => {
      try {
        const filePath = path.join(emailAttachmentsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`Deleted email attachment: ${file}`);
          clearedFiles++;
        }
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    });
    
    // Clear the in-memory extracted invoices array
    extractedInvoices = [];
    
    console.log(`Successfully cleared ${clearedFiles} email attachments`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${clearedFiles} email attachments`,
      clearedFiles: clearedFiles
    });
    
  } catch (error) {
    console.error('Error clearing email attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear email attachments'
    });
  }
});

app.post('/api/email-monitor/test-connection', async (req, res) => {
  try {
    const { email, password, host, port } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    console.log('Testing connection with:', { email, host, port, hasPassword: !!password });
    
    const testConfig = {
      user: email,
      password: password,
      host: host || 'imap.gmail.com',
      port: port || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
    
    const testImap = new Imap(testConfig);
    
    testImap.once('ready', () => {
      console.log('Test connection successful!');
      testImap.end();
      res.json({
        success: true,
        message: 'Email connection test successful'
      });
    });
    
    testImap.once('error', (err) => {
      console.error('Test connection failed:', err);
      res.status(500).json({
        success: false,
        message: 'Email connection test failed',
        error: err.message,
        details: {
          type: err.type,
          textCode: err.textCode,
          source: err.source
        }
      });
    });
    
    console.log('Initiating test connection...');
    testImap.connect();
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email connection',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Network: http://192.168.1.71:${PORT}`);
  console.log(`  Network: http://192.168.1.130:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
}); 

// Move email attachments to uploads folder for processing
app.post('/api/move-email-attachments', async (req, res) => {
  try {
    console.log('Moving email attachments to uploads folder...');
    
    const emailAttachmentsDir = path.join(__dirname, 'email_attachments');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Check if email_attachments folder exists
    if (!fs.existsSync(emailAttachmentsDir)) {
      return res.json({
        success: true,
        message: 'No email attachments folder found',
        movedFiles: [],
        totalFiles: 0
      });
    }
    
    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Get all files in email_attachments folder
    const files = fs.readdirSync(emailAttachmentsDir)
      .filter(file => !file.startsWith('.') && (file.endsWith('.pdf') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')));
    
    console.log(`Found ${files.length} email attachments to move`);
    
    if (files.length === 0) {
      return res.json({
        success: true,
        message: 'No email attachments found to move',
        movedFiles: [],
        totalFiles: 0
      });
    }
    
    // Move files from email_attachments to uploads
    const movedFiles = [];
    for (const file of files) {
      const sourcePath = path.join(emailAttachmentsDir, file);
      const destPath = path.join(uploadsDir, file);
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        fs.unlinkSync(sourcePath); // Remove from email_attachments
        movedFiles.push(file);
        console.log(`Moved email attachment: ${file}`);
      } catch (error) {
        console.error(`Error moving file ${file}:`, error);
      }
    }
    
    console.log(`Successfully moved ${movedFiles.length} email attachments to uploads`);
    
    res.json({
      success: true,
      message: `Moved ${movedFiles.length} email attachments to uploads folder`,
      movedFiles: movedFiles,
      totalFiles: files.length
    });
    
  } catch (error) {
    console.error('Error moving email attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move email attachments'
    });
  }
});

// Get list of email attachments
app.get('/api/email-attachments', async (req, res) => {
  try {
    const emailAttachmentsDir = path.join(__dirname, 'email_attachments');
    
    if (!fs.existsSync(emailAttachmentsDir)) {
      return res.json({
        success: true,
        attachments: [],
        message: 'No email attachments folder found'
      });
    }
    
    const files = fs.readdirSync(emailAttachmentsDir)
      .filter(file => !file.startsWith('.') && (file.endsWith('.pdf') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')))
      .map(file => {
        const filePath = path.join(emailAttachmentsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          modifiedAt: stats.mtime,
          path: `email_attachments/${file}`
        };
      });
    
    res.json({
      success: true,
      attachments: files,
      message: `Found ${files.length} email attachments`
    });
    
  } catch (error) {
    console.error('Error getting email attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email attachments'
    });
  }
});

// Check if approval is needed