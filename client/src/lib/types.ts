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
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: 'fas fa-check'
      };
    case 'review_needed':
      return {
        label: 'Review Needed',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
        icon: 'fas fa-exclamation-triangle'
      };
    case 'not_matched':
      return {
        label: 'Not Matched',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        icon: 'fas fa-times'
      };
    case 'pending':
      return {
        label: 'Processing',
        color: 'bg-muted text-muted-foreground',
        icon: 'fas fa-clock'
      };
    default:
      return {
        label: 'Unknown',
        color: 'bg-muted text-muted-foreground',
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
