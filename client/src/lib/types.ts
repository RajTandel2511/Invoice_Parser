export interface FileUploadProgress {
  progress: number;
  fileName: string;
  isUploading: boolean;
}

export type InvoiceStatus = 'pending' | 'matched' | 'review_needed' | 'not_matched';

export interface InvoiceStatusInfo {
  label: string;
  color: string;
  icon: string;
}

export const getStatusInfo = (status: InvoiceStatus): InvoiceStatusInfo => {
  switch (status) {
    case 'matched':
      return {
        label: 'Matched',
        color: 'status-matched',
        icon: 'fas fa-check'
      };
    case 'review_needed':
      return {
        label: 'Review Needed',
        color: 'status-review-needed',
        icon: 'fas fa-exclamation-triangle'
      };
    case 'not_matched':
      return {
        label: 'Not Matched',
        color: 'status-not-matched',
        icon: 'fas fa-times'
      };
    case 'pending':
      return {
        label: 'Processing',
        color: 'status-pending',
        icon: 'fas fa-clock'
      };
    default:
      return {
        label: 'Unknown',
        color: 'status-pending',
        icon: 'fas fa-question'
      };
  }
};

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
