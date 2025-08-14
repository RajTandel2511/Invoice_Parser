const getApiBaseUrl = () => {
  // Point to the backend server port
  return 'http://192.168.1.70:3002/api';
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

  // Force remove PO approval flag if stuck
  async forceRemovePOFlag(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Force removing PO approval flag...');
      
      const response = await fetch(`${API_BASE_URL}/force-remove-po-flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to force remove PO approval flag');
      }

      return result;
    } catch (error) {
      console.error('Force remove PO flag error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to force remove PO approval flag'
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

  // Create manual split PDFs with custom page groups
  async createManualSplitPDFs(groups: { start: number; end: number; pages: number[] }[]): Promise<{ success: boolean; message?: string; splitFiles?: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/create-manual-split-pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create manual split PDFs');
      }

      return result;
    } catch (error) {
      console.error('Create manual split PDFs error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create manual split PDFs'
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

  // Export grouped PDFs to uploads folder (supports filename-based grouping for accuracy)
  async exportGroupedPDFs(pageGroups: number[][], fileGroups?: string[][]): Promise<{ success: boolean; message?: string; exportedFiles?: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/export-grouped-pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageGroups, fileGroups }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to export grouped PDFs');
      }

      return result;
    } catch (error) {
      console.error('Export grouped PDFs error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export grouped PDFs'
      };
    }
  },

  // Merge PDF files
  async mergePDFs(filePaths: string[]): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/merge-pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePaths }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to merge PDFs');
      }

      // Return the merged PDF as a blob
      return await response.blob();
    } catch (error) {
      console.error('Merge PDFs error:', error);
      return null;
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
  },

  // Clear email attachments folder
  async clearEmailAttachments(): Promise<{ success: boolean; message?: string; clearedFolders?: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/clear-all-folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to clear email attachments folder');
      }

      return result;
    } catch (error) {
      console.error('Clear email attachments error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear email attachments folder'
      };
    }
  },

  // Clear processing folders (uploads, split_pages, manual_split_pages)
  async clearProcessingFolders(): Promise<{ success: boolean; message?: string; clearedFolders?: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/clear-processing-folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to clear processing folders');
      }

      return result;
    } catch (error) {
      console.error('Clear processing folders error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear processing folders'
      };
    }
  },

  // Get email attachments
  async getEmailAttachments(): Promise<{ success: boolean; attachments?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/email-attachments`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get email attachments');
      }

      return result;
    } catch (error) {
      console.error('Get email attachments error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get email attachments'
      };
    }
  },

  // Move email attachments to uploads folder
  async moveEmailAttachments(): Promise<{ success: boolean; message?: string; movedFiles?: string[]; totalFiles?: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/move-email-attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to move email attachments');
      }

      return result;
    } catch (error) {
      console.error('Move email attachments error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to move email attachments'
      };
    }
  },

  // Note: Emails are now automatically marked as read during processing
  // This function is no longer needed

  // Get processed emails status
  async getProcessedEmailsStatus(): Promise<{ success: boolean; processedCount?: number; processedIds?: string[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/processed-emails-status`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get processed emails status');
      }

      return result;
    } catch (error) {
      console.error('Get processed emails status error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get processed emails status'
      };
    }
  },

  // Get files from raw_pdfs directory (where processed files are stored)
  async getRawPdfFiles(): Promise<{ success: boolean; files?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/raw-pdf-files`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get raw PDF files');
      }

      return result;
    } catch (error) {
      console.error('Get raw PDF files error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get raw PDF files'
      };
    }
  },

  // Get preserved files from preview storage (for processed invoices preview)
  async getPreservedPdfFiles(): Promise<{ success: boolean; files?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/preserved-pdf-files`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get preserved PDF files');
      }

      return result;
    } catch (error) {
      console.error('Get preserved PDF files error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get preserved PDF files'
      };
    }
  }
}; 