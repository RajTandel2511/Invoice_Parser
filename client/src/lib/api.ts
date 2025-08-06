const getApiBaseUrl = () => {
  // Use network IP if accessed via network, otherwise localhost
  const hostname = window.location.hostname;
  if (hostname === '192.168.1.71') {
    return 'http://192.168.1.71:3001/api';
  }
  return 'http://localhost:3001/api';
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
  async processInvoices(): Promise<{ success: boolean; message: string; files?: string[]; stdout?: string; stderr?: string }> {
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
  }
}; 