import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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
    const lastContentHashPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'last_content_hash.txt');
    const processingFlagPath = path.join(__dirname, 'process', 'data', 'processed', 'processing_complete.flag');
    
    const approvalNeeded = fs.existsSync(approvalFlagPath);
    const csvExists = fs.existsSync(csvPath);
    const processingComplete = fs.existsSync(processingFlagPath);
    
    console.log('Approval flag exists:', approvalNeeded);
    console.log('CSV file exists:', csvExists);
    console.log('Processing complete flag exists:', processingComplete);
    
    // Check if approval is needed - we need to be more flexible about timing
    // The Python script might create processing_complete.flag but still need approval
    console.log('Processing complete flag exists:', processingComplete);
    console.log('Approval flag exists:', approvalNeeded);
    
    // If approval flag exists, we should show approval regardless of processing status
    // The Python script creates approval_needed.flag when it needs user input
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
    let csvModTime = null;
    let csvContent = '';
    if (csvExists) {
      try {
        const csvStats = fs.statSync(csvPath);
        csvModTime = csvStats.mtime;
        csvContent = fs.readFileSync(csvPath, 'utf-8');
        csvHasContent = csvContent.trim().length > 0;
        console.log('CSV file has content:', csvHasContent);
        console.log('CSV file size:', csvContent.length, 'characters');
        console.log('CSV file modification time:', csvModTime);
      } catch (error) {
        console.error('Error reading CSV file:', error);
      }
    }
    
    if (approvalNeeded && csvExists && csvHasContent) {
      // Check if the CSV file was modified recently (within last 2 minutes)
      const currentTime = new Date();
      const timeDiffMinutes = (currentTime - csvModTime) / (1000 * 60);
      const timeDiffSeconds = (currentTime - csvModTime) / 1000;
      
      console.log('CSV file modification time:', csvModTime);
      console.log('Time difference (minutes):', timeDiffMinutes);
      console.log('Time difference (seconds):', timeDiffSeconds);
      
      // Only consider it a new approval if the file was modified within the last 2 minutes
      if (timeDiffMinutes > 2) {
        console.log('CSV file is too old, not showing approval dialog');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }
      
      // If the file was modified very recently (within last 30 seconds), it's very fresh
      if (timeDiffSeconds <= 30) {
        console.log('CSV file was modified within last 30 seconds - extremely fresh data!');
      }
      
      // Create a hash of the CSV content to detect if it has actually changed
      const crypto = await import('crypto');
      const contentHash = crypto.createHash('md5').update(csvContent).digest('hex');
      console.log('CSV content hash:', contentHash);
      
      // Check if we've seen this content before
      let lastContentHash = '';
      if (fs.existsSync(lastContentHashPath)) {
        try {
          lastContentHash = fs.readFileSync(lastContentHashPath, 'utf-8').trim();
          console.log('Last content hash:', lastContentHash);
        } catch (error) {
          console.error('Error reading last content hash:', error);
        }
      }
      
      // Only show approval if content has changed AND file was modified recently
      if (contentHash === lastContentHash) {
        console.log('Content hash unchanged - not showing approval dialog');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }
      
      // Save the new content hash for next time
      try {
        fs.writeFileSync(lastContentHashPath, contentHash);
        console.log('Saved new content hash:', contentHash);
      } catch (error) {
        console.error('Error saving content hash:', error);
      }
      
      // Read CSV file to get vendor matches (we already have the content)
      
      if (!csvContent.trim()) {
        console.log('CSV file is empty');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }

      // Parse CSV using a simpler approach
      const matches = [];
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) {
        console.log('CSV file has no data rows');
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
      
      console.log('Parsed headers:', headers);
      
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
        
        console.log('Parsed match:', match);
        matches.push(match);
      }

      console.log('Found matches:', matches.length);
      
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
    console.error('Error checking approval status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check approval status'
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
    const lastPOContentHashPath = path.join(__dirname, 'process', 'outputs', 'excel_files', 'last_po_content_hash.txt');
    
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
    let csvModTime = null;
    let csvContent = '';
    if (csvExists) {
      try {
        const csvStats = fs.statSync(csvPath);
        csvModTime = csvStats.mtime;
        csvContent = fs.readFileSync(csvPath, 'utf-8');
        csvHasContent = csvContent.trim().length > 0;
        console.log('PO CSV file has content:', csvHasContent);
        console.log('PO CSV file size:', csvContent.length, 'characters');
        console.log('PO CSV file modification time:', csvModTime);
      } catch (error) {
        console.error('Error reading PO CSV file:', error);
      }
    }
    
    if (poApprovalNeeded && csvExists && csvHasContent) {
      // Check if the CSV file was modified recently (within last 2 minutes)
      const currentTime = new Date();
      const timeDiffMinutes = (currentTime - csvModTime) / (1000 * 60);
      const timeDiffSeconds = (currentTime - csvModTime) / 1000;
      
      console.log('PO CSV file modification time:', csvModTime);
      console.log('Time difference (minutes):', timeDiffMinutes);
      console.log('Time difference (seconds):', timeDiffSeconds);
      
      // Only consider it a new approval if the file was modified within the last 2 minutes
      if (timeDiffMinutes > 2) {
        console.log('PO CSV file is too old, not showing approval dialog');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }
      
      // If the file was modified very recently (within last 30 seconds), it's very fresh
      if (timeDiffSeconds <= 30) {
        console.log('PO CSV file was modified within last 30 seconds - extremely fresh data!');
      }
      
      // Create a hash of the CSV content to detect if it has actually changed
      const crypto = await import('crypto');
      const contentHash = crypto.createHash('md5').update(csvContent).digest('hex');
      console.log('PO CSV content hash:', contentHash);
      
      // Check if we've seen this content before
      let lastContentHash = '';
      if (fs.existsSync(lastPOContentHashPath)) {
        try {
          lastContentHash = fs.readFileSync(lastPOContentHashPath, 'utf-8').trim();
          console.log('Last PO content hash:', lastContentHash);
        } catch (error) {
          console.error('Error reading last PO content hash:', error);
        }
      }
      
      // Only show approval if content has changed AND file was modified recently
      if (contentHash === lastContentHash) {
        console.log('PO content hash unchanged - not showing approval dialog');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }
      
      // Save the new content hash for next time
      try {
        fs.writeFileSync(lastPOContentHashPath, contentHash);
        console.log('Saved new PO content hash:', contentHash);
      } catch (error) {
        console.error('Error saving PO content hash:', error);
      }
      
      // Read CSV file to get PO matches (we already have the content)
      
      if (!csvContent.trim()) {
        console.log('PO CSV file is empty');
        return res.json({
          success: true,
          approvalNeeded: false,
          matches: []
        });
      }

      // Parse CSV using a simpler approach
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
          match[header] = value;
        });
        
        matches.push(match);
      }
      
      console.log('Parsed PO matches:', matches);
      
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
    console.error('Error checking PO approval needed:', error);
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
      message: 'PO matches approved successfully'
    });
  } catch (error) {
    console.error('Error approving PO matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve PO matches'
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Network: http://192.168.1.71:${PORT}`);
  console.log(`  Network: http://192.168.1.130:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
}); 