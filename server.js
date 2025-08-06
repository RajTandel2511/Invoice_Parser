import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const app = express();
const PORT = 3001;

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

// Process invoices endpoint
app.post('/api/process-invoices', async (req, res) => {
  try {
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

    // Execute Python script
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

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Python script executed successfully');
        res.json({
          success: true,
          message: `Successfully processed ${movedFiles.length} files`,
          files: movedFiles,
          stdout: stdout,
          stderr: stderr
        });
      } else {
        console.error(`Python script failed with code ${code}`);
        res.status(500).json({
          success: false,
          message: `Python script failed with exit code ${code}`,
          stdout: stdout,
          stderr: stderr
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start Python process',
        error: error.message
      });
    });

  } catch (error) {
    console.error('Process invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing invoices',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
}); 