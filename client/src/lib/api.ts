const getApiBaseUrl = () => {
  // Use relative URL for proxy configuration
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  // Upload file
  async uploadFile(file: File): Promise<{ success: boolean; message: string; file?: any }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },

  // Get list of uploaded files
  async getUploadedFiles(): Promise<{ success: boolean; files?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get files');
      }

      return result;
    } catch (error) {
      console.error('Get files error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get files'
      };
    }
  },

  // Delete uploaded file
  async deleteFile(filename: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete file');
      }

      return result;
    } catch (error) {
      console.error('Delete file error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  },

  // Process invoices
  async processInvoices(): Promise<{ success: boolean; message: string; files?: string[]; stdout?: string; stderr?: string; vendorMatches?: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/process-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Processing failed');
      }

      return result;
    } catch (error) {
      console.error('Process invoices error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  },

  // Get vendor matches
  async getVendorMatches(): Promise<{ success: boolean; matches?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor-matches`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get vendor matches');
      }

      return result;
    } catch (error) {
      console.error('Get vendor matches error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get vendor matches'
      };
    }
  },

  // Check if approval is needed
  async checkApprovalNeeded(): Promise<{ success: boolean; approvalNeeded?: boolean; matches?: any[]; message?: string }> {
    try {
      console.log('Checking if approval is needed...');
      
      const response = await fetch(`${API_BASE_URL}/check-approval-needed`);
      
      console.log('Check approval response status:', response.status);
      
      const result = await response.json();
      
      console.log('Check approval response data:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check approval status');
      }

      return result;
    } catch (error) {
      console.error('Check approval needed error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check approval status'
      };
    }
  },

  // Approve vendor matches
  async approveVendors(approvedMatches: any[]): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Sending approval request with matches:', approvedMatches);
      
      const response = await fetch(`${API_BASE_URL}/approve-vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedMatches }),
      });

      console.log('Approval response status:', response.status);
      
      const result = await response.json();
      
      console.log('Approval response data:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve vendors');
      }

      return result;
    } catch (error) {
      console.error('Approve vendors error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve vendors'
      };
    }
  },

  // Check processing status
  async checkProcessingStatus(): Promise<{ success: boolean; isProcessingComplete?: boolean; isStillRunning?: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/processing-status`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check processing status');
      }

      return result;
    } catch (error) {
      console.error('Check processing status error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check processing status'
      };
    }
  },

  // Check if raw_pdfs folder is empty
  async checkRawPdfs(): Promise<{ success: boolean; isEmpty?: boolean; fileCount?: number; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-raw-pdfs`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check raw PDFs folder');
      }

      return result;
    } catch (error) {
      console.error('Check raw PDFs error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check raw PDFs folder'
      };
    }
  },

  // Check if processed files exist
  async checkProcessedFiles(): Promise<{ success: boolean; apInvoicesExists?: boolean; spectrumExists?: boolean; bothExist?: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-processed-files`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check processed files');
      }

      return result;
    } catch (error) {
      console.error('Check processed files error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check processed files'
      };
    }
  },

  // Check if PO approval is needed
  async checkPOApprovalNeeded(): Promise<{ success: boolean; approvalNeeded?: boolean; matches?: any[]; message?: string }> {
    try {
      console.log('Checking if PO approval is needed...');
      
      const response = await fetch(`${API_BASE_URL}/check-po-approval-needed`);
      const result = await response.json();
      
      console.log('PO approval check response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check PO approval status');
      }

      return result;
    } catch (error) {
      console.error('Check PO approval needed error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check PO approval status'
      };
    }
  },

  // Approve PO matches
  async approvePOMatches(approvedMatches: any[]): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Sending PO approval request with matches:', approvedMatches);
      
      const response = await fetch(`${API_BASE_URL}/approve-po-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedMatches }),
      });

      console.log('PO approval response status:', response.status);
      
      const result = await response.json();
      
      console.log('PO approval response data:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve PO matches');
      }

      return result;
    } catch (error) {
      console.error('Approve PO matches error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve PO matches'
      };
    }
  },

  // Download AP invoices file
  async downloadAPInvoices(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/download/ap-invoices`);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Download failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'APInvoicesImport1.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download AP invoices error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Download failed'
      };
    }
  },

  // Download invoice spectrum file
  async downloadInvoiceSpectrum(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/download/invoice-spectrum`);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Download failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'invoice_spectrum_format.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download invoice spectrum error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Download failed'
      };
    }
  },

  // Check if uploads folder is empty
  async checkUploadsFolder(): Promise<{ success: boolean; isEmpty?: boolean; fileCount?: number; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-uploads-folder`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to check uploads folder');
      }

      return result;
    } catch (error) {
      console.error('Check uploads folder error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check uploads folder'
      };
    }
  },

  // Get PDF page information
  async getPDFPages(): Promise<{ success: boolean; pdfFiles?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf-pages`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get PDF page information');
      }

      return result;
    } catch (error) {
      console.error('Get PDF pages error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get PDF page information'
      };
    }
  },

  // Get PDF file for thumbnail generation
  async getPDFFile(filename: string): Promise<{ success: boolean; blob?: Blob; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf-file/${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to get PDF file');
      }

      const blob = await response.blob();
      return {
        success: true,
        blob
      };
    } catch (error) {
      console.error('Get PDF file error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get PDF file'
      };
    }
  },

  // Get split PDF file (from split_pages directory)
  async getSplitPDFFile(filename: string): Promise<{ success: boolean; blob?: Blob; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/split-pdf-file/${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to get split PDF file');
      }

      const blob = await response.blob();
      return {
        success: true,
        blob
      };
    } catch (error) {
      console.error('Get split PDF file error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get split PDF file'
      };
    }
  },

  // Export split PDFs to uploads folder
  async exportSplitPDFs(): Promise<{ success: boolean; message?: string; exportedFiles?: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/export-split-pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to export split PDFs');
      }

      return result;
    } catch (error) {
      console.error('Export split PDFs error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export split PDFs'
      };
    }
  },

  // Split PDF pages into individual files
  async splitPDFPages(): Promise<{ success: boolean; message?: string; splitFiles?: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/split-pdf-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to split PDF pages');
      }

      return result;
    } catch (error) {
      console.error('Split PDF pages error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to split PDF pages'
      };
    }
  }
}; 