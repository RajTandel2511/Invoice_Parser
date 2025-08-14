# INVOICE PARSER SYSTEM - STANDARD OPERATING PROCEDURE (SOP)

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [System Components](#system-components)
4. [User Workflows](#user-workflows)
5. [Technical Implementation](#technical-implementation)
6. [Network Configuration](#network-configuration)
7. [File Processing Pipeline](#file-processing-pipeline)
8. [Troubleshooting & Maintenance](#troubleshooting--maintenance)
9. [Security & Data Handling](#security--data-handling)
10. [Deployment & Updates](#deployment--updates)

---

## 1. SYSTEM OVERVIEW

### Purpose
The Invoice Parser System is a comprehensive web-based application designed to automate the processing of invoices through OCR (Optical Character Recognition), AI-powered data extraction, and intelligent matching with purchase orders. The system streamlines accounts payable workflows by reducing manual data entry and improving accuracy.

### Key Capabilities
- **Document Upload**: Support for PDF, PNG, and JPG files up to 10MB
- **OCR Processing**: Advanced text extraction using Tesseract and PyMuPDF
- **AI Data Extraction**: Intelligent parsing of invoice fields using Doctr models
- **PO Matching**: Automatic matching with purchase order databases
- **Data Export**: Generation of Excel files compatible with Spectrum accounting system
- **Network Integration**: Support for both local and network-based deployments

### Target Users
- Accounts Payable staff
- Financial controllers
- Procurement teams
- Administrative personnel

---

## 2. ARCHITECTURE & TECHNOLOGY STACK

### Frontend Architecture
```
React 18 + TypeScript
├── Vite (Build Tool)
├── Tailwind CSS (Styling)
├── shadcn/ui (Component Library)
├── TanStack Query (State Management)
├── Wouter (Routing)
└── React Hook Form (Form Handling)
```

### Backend Architecture
```
Node.js + Express.js
├── Multer (File Upload Handling)
├── CORS (Cross-Origin Support)
├── PDF Processing (pdf-lib)
├── Excel Generation (XLSX)
└── Email Integration (IMAP)
```

### Python Processing Pipeline
```
Python 3.8+
├── PyMuPDF (PDF Processing)
├── OpenCV (Image Processing)
├── Tesseract (OCR Engine)
├── Doctr (AI Document Understanding)
└── Pandas (Data Manipulation)
```

### System Architecture Diagram
```
[User Browser] ←→ [React Frontend] ←→ [Express.js API] ←→ [Python Pipeline]
                                    ↓
                              [File Storage]
                              [Database]
                              [Network Shares]
```

---

## 3. SYSTEM COMPONENTS

### 3.1 Frontend Components

#### Core Layout Components
- **Header** (`components/layout/header.tsx`): Navigation and user controls
- **Sidebar** (`components/layout/sidebar.tsx`): Main navigation menu
- **ErrorBoundary** (`components/ErrorBoundary.tsx`): Error handling wrapper

#### Invoice Management Components
- **UploadPanel** (`components/invoice/upload-panel.tsx`): File upload interface
- **DetailPanel** (`components/invoice/detail-panel.tsx`): Invoice detail view
- **InvoiceListItem** (`components/invoice/invoice-list-item.tsx`): Invoice list display
- **ExtractedInvoicesDisplay** (`components/invoice/extracted-invoices-display.tsx`): Processed invoice results

#### Specialized Components
- **POApprovalDialog** (`components/invoice/po-approval-dialog.tsx`): Purchase order approval interface
- **VendorApprovalDialog** (`components/invoice/vendor-approval-dialog.tsx`): Vendor verification interface
- **EmailMonitorPanel** (`components/invoice/email-monitor-panel.tsx`): Email attachment monitoring
- **PagePreview** (`components/invoice/page-preview.tsx`): Document page preview

#### UI Components
- **Theme System**: Dark/light mode toggle with persistent storage
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Loading States**: Skeleton loaders and progress indicators
- **Toast Notifications**: User feedback system

### 3.2 Backend Components

#### API Endpoints
- **POST /api/upload**: File upload handling
- **POST /api/process**: Invoice processing initiation
- **GET /api/invoices**: Invoice data retrieval
- **POST /api/email-monitor**: Email monitoring setup
- **GET /api/status**: Processing status updates

#### File Processing Services
- **PDF Processing**: Page splitting, text extraction, image conversion
- **OCR Services**: Multi-engine OCR with fallback options
- **Data Extraction**: AI-powered field recognition and parsing
- **Excel Generation**: Spectrum-compatible output formatting

#### Integration Services
- **Email Monitoring**: IMAP-based attachment processing
- **Network File Access**: SMB share integration
- **Database Operations**: Invoice data persistence and retrieval

### 3.3 Python Pipeline Components

#### Core Processing Modules
- **Document Preprocessing**: File validation, format conversion, page splitting
- **OCR Engine**: Tesseract integration with language support
- **AI Models**: Doctr-based document understanding
- **Data Extraction**: Field mapping and validation
- **Output Generation**: Excel file creation and formatting

#### Network Integration
- **Path Management**: Dynamic network/local path resolution
- **File Synchronization**: Network share access with local fallback
- **Configuration Management**: Environment-based settings

---

## 4. USER WORKFLOWS

### 4.1 Invoice Upload Workflow

#### Step 1: File Selection
1. Navigate to Upload page (`/upload`)
2. Drag and drop files or click to browse
3. Supported formats: PDF, PNG, JPG
4. File size limit: 10MB per file

#### Step 2: File Processing
1. System validates file format and size
2. Files are uploaded to server storage
3. Python pipeline processes documents
4. OCR extraction and data parsing begins

#### Step 3: Data Review
1. Processed data appears in invoice list
2. Review extracted information for accuracy
3. Edit fields as needed
4. Verify vendor and PO matching

#### Step 4: Approval & Export
1. Approve matched invoices
2. Review unmatched items
3. Generate Excel export for Spectrum
4. Archive processed documents

### 4.2 Purchase Order Matching Workflow

#### Step 1: Invoice Analysis
1. System extracts PO numbers from invoices
2. Searches vendor database for matches
3. Identifies job codes and project references
4. Calculates tax and total amounts

#### Step 2: Matching Process
1. Automatic matching based on PO numbers
2. Vendor name similarity scoring
3. Amount validation and verification
4. Status assignment (Matched/Review Needed/Not Matched)

#### Step 3: Manual Review
1. Review unmatched invoices
2. Verify vendor information
3. Update PO references if needed
4. Approve or reject matches

#### Step 4: Data Export
1. Generate matched invoice report
2. Create Spectrum import file
3. Export to network share or local storage
4. Update processing status

### 4.3 Email Monitoring Workflow

#### Step 1: Email Setup
1. Configure IMAP server settings
2. Set monitoring frequency
3. Define attachment filters
4. Establish processing rules

#### Step 2: Automatic Processing
1. System monitors email inbox
2. Downloads invoice attachments
3. Processes documents automatically
4. Updates invoice database

#### Step 3: Review & Approval
1. Review auto-processed invoices
2. Verify extraction accuracy
3. Approve or edit data
4. Handle exceptions manually

---

## 5. TECHNICAL IMPLEMENTATION

### 5.1 Frontend Implementation

#### State Management
```typescript
// TanStack Query for server state
const { data: invoices } = useQuery({
  queryKey: ["invoices"],
  queryFn: mockApiRequest.getInvoices,
});

// Local state for UI components
const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
```

#### Component Architecture
- **Functional Components**: Modern React with hooks
- **TypeScript**: Strict typing for all components
- **Props Interface**: Well-defined component contracts
- **Error Boundaries**: Graceful error handling

#### Responsive Design
- **Mobile-First**: Tailwind CSS breakpoint system
- **Flexbox Layout**: Adaptive component positioning
- **Touch Support**: Mobile-optimized interactions
- **Theme System**: Dark/light mode with CSS variables

### 5.2 Backend Implementation

#### File Upload Handling
```javascript
// Multer configuration for file uploads
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

#### API Structure
- **RESTful Endpoints**: Standard HTTP methods
- **Error Handling**: Comprehensive error responses
- **Validation**: Input sanitization and validation
- **CORS Support**: Cross-origin request handling

#### File Processing
- **Asynchronous Processing**: Non-blocking file operations
- **Progress Tracking**: Real-time status updates
- **Error Recovery**: Graceful failure handling
- **Resource Management**: Memory and storage optimization

### 5.3 Python Pipeline Implementation

#### OCR Processing
```python
# Multi-engine OCR with fallback
def process_document(file_path):
    try:
        # Try Doctr first (AI-powered)
        result = doctr_ocr(file_path)
        if result.quality_score > 0.8:
            return result
    except:
        pass
    
    # Fallback to Tesseract
    return tesseract_ocr(file_path)
```

#### Data Extraction
- **Field Recognition**: AI-powered text classification
- **Pattern Matching**: Regular expression validation
- **Data Validation**: Format and range checking
- **Error Correction**: Fuzzy matching and suggestions

#### Network Integration
- **Path Resolution**: Dynamic network/local path switching
- **Fallback Handling**: Local processing when network unavailable
- **Configuration Management**: Environment-based settings
- **Error Logging**: Comprehensive error tracking

---

## 6. NETWORK CONFIGURATION

### 6.1 Network Architecture

#### Server Configuration
- **Primary Server**: 192.168.1.130
- **Backup Server**: 192.168.1.71
- **Network Share**: \\192.168.1.130\Projects\Raj\
- **Local Fallback**: data/network_fallback/

#### Access Methods
- **SMB Protocol**: Windows network sharing
- **UNC Paths**: Universal naming convention
- **Authentication**: Windows domain credentials
- **Permissions**: Read/write access for processing

### 6.2 Configuration Files

#### Network Configuration
```python
# network_config.py
NETWORK_CONFIG = {
    "projects_server": "192.168.1.130",
    "projects_share": "Projects", 
    "projects_folder": "Raj",
    "enable_network": True,
    "local_fallback": "data/network_fallback/"
}
```

#### Environment Variables
```bash
# .env file
NETWORK_ENABLED=true
PROJECTS_SERVER=192.168.1.130
PROJECTS_SHARE=Projects
PROJECTS_FOLDER=Raj
```

### 6.3 Network Troubleshooting

#### Common Issues
1. **Network Unreachable**: Check server connectivity
2. **Authentication Failed**: Verify domain credentials
3. **Permission Denied**: Check folder access rights
4. **Path Not Found**: Verify share and folder names

#### Diagnostic Commands
```bash
# Test network connectivity
ping 192.168.1.130

# Test SMB access
net use \\192.168.1.130\Projects

# Check network configuration
ipconfig /all
```

---

## 7. FILE PROCESSING PIPELINE

### 7.1 Document Processing Flow

#### Input Validation
1. **File Format Check**: Verify PDF, PNG, JPG
2. **Size Validation**: Ensure under 10MB limit
3. **Content Analysis**: Check for readable content
4. **Metadata Extraction**: Extract creation date, author

#### Preprocessing
1. **Format Conversion**: Convert images to standard format
2. **Page Splitting**: Separate multi-page documents
3. **Image Enhancement**: Improve OCR quality
4. **Noise Reduction**: Remove artifacts and background

#### OCR Processing
1. **Text Extraction**: Primary OCR with Doctr
2. **Quality Assessment**: Score extraction accuracy
3. **Fallback Processing**: Tesseract if needed
4. **Post-Processing**: Text cleanup and formatting

#### Data Extraction
1. **Field Identification**: Locate invoice fields
2. **Value Extraction**: Extract field contents
3. **Validation**: Check data format and ranges
4. **Normalization**: Standardize data formats

### 7.2 Output Generation

#### Excel File Creation
1. **Template Loading**: Load Spectrum-compatible template
2. **Data Mapping**: Map extracted fields to template
3. **Formatting**: Apply proper cell formatting
4. **Validation**: Check for required fields

#### Data Export
1. **File Generation**: Create Excel workbook
2. **Network Upload**: Save to network share
3. **Local Backup**: Maintain local copy
4. **Status Update**: Mark processing complete

### 7.3 Quality Assurance

#### Accuracy Metrics
- **OCR Confidence**: Minimum 80% confidence score
- **Field Completion**: Required fields must be present
- **Data Validation**: Format and range checking
- **Manual Review**: Human verification for low-confidence items

#### Error Handling
- **Processing Failures**: Graceful degradation
- **Partial Results**: Continue with available data
- **Retry Logic**: Automatic retry for transient failures
- **User Notification**: Clear error messages and guidance

---

## 8. TROUBLESHOOTING & MAINTENANCE

### 8.1 Common Issues

#### Frontend Issues
1. **Page Not Loading**: Check network connectivity
2. **Upload Failures**: Verify file format and size
3. **Data Not Displaying**: Check API connectivity
4. **Theme Issues**: Clear browser cache

#### Backend Issues
1. **Server Not Starting**: Check port availability
2. **File Upload Errors**: Verify storage permissions
3. **Processing Failures**: Check Python dependencies
4. **Network Errors**: Verify network configuration

#### Python Pipeline Issues
1. **OCR Failures**: Check Tesseract installation
2. **Memory Errors**: Optimize image processing
3. **Network Timeouts**: Adjust timeout settings
4. **Dependency Issues**: Update Python packages

### 8.2 Maintenance Procedures

#### Daily Maintenance
1. **Log Review**: Check error logs for issues
2. **Storage Cleanup**: Remove temporary files
3. **Performance Monitoring**: Track processing times
4. **User Feedback**: Address reported issues

#### Weekly Maintenance
1. **Database Backup**: Backup invoice data
2. **Log Rotation**: Archive old log files
3. **Performance Analysis**: Review system metrics
4. **Security Updates**: Check for vulnerabilities

#### Monthly Maintenance
1. **System Updates**: Update dependencies
2. **Performance Optimization**: Tune system parameters
3. **User Training**: Conduct user training sessions
4. **Documentation Updates**: Update SOP and user guides

### 8.3 Performance Optimization

#### Frontend Optimization
- **Code Splitting**: Lazy load components
- **Image Optimization**: Compress and optimize images
- **Caching**: Implement browser caching
- **Bundle Analysis**: Monitor bundle sizes

#### Backend Optimization
- **Database Indexing**: Optimize database queries
- **File Processing**: Parallel processing where possible
- **Memory Management**: Optimize memory usage
- **Network Optimization**: Reduce network calls

---

## 9. SECURITY & DATA HANDLING

### 9.1 Security Measures

#### File Security
- **Upload Validation**: Strict file type checking
- **Size Limits**: Prevent large file attacks
- **Virus Scanning**: Scan uploaded files
- **Access Control**: Restrict file access

#### Data Protection
- **Encryption**: Encrypt sensitive data
- **Access Logging**: Track all data access
- **User Authentication**: Secure user access
- **Session Management**: Secure session handling

#### Network Security
- **Firewall Protection**: Restrict network access
- **VPN Access**: Secure remote access
- **SSL/TLS**: Encrypt data in transit
- **Regular Audits**: Security vulnerability assessments

### 9.2 Data Handling

#### Data Retention
- **Processing Files**: Delete after 30 days
- **Invoice Data**: Retain for 7 years
- **Log Files**: Archive after 1 year
- **Backup Files**: Retain for 1 year

#### Data Privacy
- **PII Protection**: Mask sensitive information
- **Access Controls**: Role-based permissions
- **Audit Trails**: Track data modifications
- **Compliance**: GDPR and local regulations

#### Backup Procedures
- **Automated Backups**: Daily incremental backups
- **Manual Backups**: Before major updates
- **Offsite Storage**: Network share backups
- **Recovery Testing**: Regular restore testing

---

## 10. DEPLOYMENT & UPDATES

### 10.1 Deployment Process

#### Development Environment
1. **Local Setup**: Install dependencies
2. **Configuration**: Set environment variables
3. **Testing**: Run test suite
4. **Validation**: Verify functionality

#### Production Deployment
1. **Build Process**: Create production build
2. **Environment Setup**: Configure production settings
3. **Database Migration**: Update database schema
4. **Service Restart**: Restart application services

#### Network Deployment
1. **Server Preparation**: Configure network servers
2. **Share Setup**: Configure network shares
3. **Service Installation**: Install required services
4. **Testing**: Verify network functionality

### 10.2 Update Procedures

#### Frontend Updates
1. **Code Changes**: Update React components
2. **Dependency Updates**: Update npm packages
3. **Build Process**: Create new production build
4. **Deployment**: Deploy to production servers

#### Backend Updates
1. **API Changes**: Update Express.js endpoints
2. **Service Updates**: Update Python dependencies
3. **Configuration Updates**: Update environment settings
4. **Service Restart**: Restart backend services

#### Database Updates
1. **Schema Changes**: Update database structure
2. **Data Migration**: Migrate existing data
3. **Validation**: Verify data integrity
4. **Rollback Plan**: Prepare rollback procedures

### 10.3 Monitoring & Alerts

#### System Monitoring
- **Performance Metrics**: Track response times
- **Error Rates**: Monitor error frequencies
- **Resource Usage**: Monitor CPU and memory
- **Network Status**: Monitor connectivity

#### Alert Systems
- **Error Alerts**: Notify on processing failures
- **Performance Alerts**: Notify on slow performance
- **Storage Alerts**: Notify on storage issues
- **Network Alerts**: Notify on connectivity issues

---

## APPENDIX

### A. File Structure Reference
```
Invoice_Parser_Latest/
├── client/                 # React frontend
├── process/               # Python processing pipeline
├── shared/               # Shared TypeScript types
├── uploads/              # File upload storage
├── server.js             # Express.js backend
└── configuration files
```

### B. API Endpoint Reference
- **POST /api/upload**: File upload
- **POST /api/process**: Start processing
- **GET /api/invoices**: Get invoice list
- **GET /api/status**: Get processing status

### C. Configuration Reference
- **Network Settings**: IP addresses and share paths
- **Environment Variables**: Configuration parameters
- **File Limits**: Size and format restrictions
- **Processing Settings**: OCR and AI model parameters

### D. Troubleshooting Quick Reference
- **Common Errors**: Quick solutions to frequent issues
- **Contact Information**: Support team contacts
- **Escalation Procedures**: When to escalate issues
- **Emergency Contacts**: Critical system contacts

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Date + 6 months]  
**Prepared By**: [Your Name]  
**Approved By**: [Manager Name]
