const getApiBaseUrl = () => {
  // Use network IP if accessed via network, otherwise localhost
  const hostname = window.location.hostname;
  const port = 3002;
  
  // Check if we're on the network
  if (hostname === '192.168.1.71' || hostname === '192.168.1.130') {
    return `http://${hostname}:${port}/api`;
  }
  
  // For localhost or any other local development
  return `http://localhost:${port}/api`;
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
  }
}; 