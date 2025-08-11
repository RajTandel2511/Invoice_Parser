import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText, Download, CheckCircle, Play, CheckCircle2, Search, Filter, Eye, Building2, Briefcase, MessageSquare, Hash, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import VendorApprovalDialog from '@/components/invoice/vendor-approval-dialog';
import POApprovalDialog from '@/components/invoice/po-approval-dialog';
import UploadedFilesDialog from '@/components/invoice/uploaded-files-dialog';
import PagePreview from '@/components/invoice/page-preview';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UploadedFile {
  filename: string;
  size: number;
  uploadedAt: string;
  path: string;
}

interface VendorMatch {
  TXT_File?: string;
  Vendor_Code?: string;
  Vendor_Name?: string;
  Vendor_Contact?: string;
  Vendor_Address?: string;
  Address_Match_Score?: string;
  Matched_Contact?: string;
  Matched_By?: string;
}

interface POMatch {
  file_name?: string;
  extracted_po_number?: string;
  clean_po_number?: string;
  PO_Number?: string;
  Job_Number?: string;
  WO_Number?: string;
  Remarks?: string;
  po_verified_by?: string;
  job_verified_by?: string;
}

interface ProcessedInvoice {
  id: string;
  invoiceNumber: string;
  vendorCode: string;
  vendorName: string;
  invoiceType: string;
  poNumber: string;
  jobNumber?: string;
  woNumber?: string;
  remarks?: string;
  invoiceDate: string;
  invoiceAmount: string;
  taxAmount: string;
  shippingCharges: string;
  amountBeforeTaxes: string;
  distributionGLAccount: string;
  phaseCode: string;
  costType: string;
}

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: ProcessedInvoice | null;
}

function InvoiceDetailModal({ isOpen, onClose, invoice }: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to check if a field has meaningful data
  const hasData = (value: string | undefined) => {
    return value && value.trim() !== '' && value !== 'N/A' && value !== '0' && value !== '0.00';
  };

  // Get available project fields
  const projectFields = [
    { label: 'PO Number', value: invoice.poNumber },
    { label: 'Job Number', value: invoice.jobNumber },
    { label: 'WO Number', value: invoice.woNumber },
    { label: 'Remarks', value: invoice.remarks }
  ].filter(field => hasData(field.value));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">#{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Generated</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Key Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl p-5 border border-blue-100 dark:border-blue-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Invoice Number</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vendor</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{invoice.vendorName || invoice.vendorCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(invoice.invoiceAmount)}</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Invoice Information */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Invoice Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Invoice Type:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.invoiceType || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Invoice Date:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendor Code:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.vendorCode}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <Hash className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    Financial Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.amountBeforeTaxes)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tax:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Shipping:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.shippingCharges)}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Total:</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(invoice.invoiceAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Project Information */}
                {projectFields.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Project Information
                    </h3>
                    <div className="space-y-3">
                      {projectFields.map((field, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{field.label}:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accounting Details */}
                {(hasData(invoice.distributionGLAccount) || hasData(invoice.phaseCode) || hasData(invoice.costType)) && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Accounting Details
                    </h3>
                    <div className="space-y-3">
                      {hasData(invoice.distributionGLAccount) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">GL Account:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.distributionGLAccount}</span>
                        </div>
                      )}
                      {hasData(invoice.phaseCode) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Phase Code:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.phaseCode}</span>
                        </div>
                      )}
                      {hasData(invoice.costType) && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost Type:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.costType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    Processing Status
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full shadow-sm"></div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">Successfully Processed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Processing System</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data source: Excel Processing Pipeline</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Invoice Value</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(invoice.invoiceAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Upload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVendorApproval, setShowVendorApproval] = useState(false);
  const [vendorMatches, setVendorMatches] = useState<VendorMatch[]>([]);
  const [hasShownApprovalDialog, setHasShownApprovalDialog] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [lastSeenDataHash, setLastSeenDataHash] = useState<string>('');
  const [isPostApprovalProcessing, setIsPostApprovalProcessing] = useState(false);
  
  // PO approval state
  const [showPOApproval, setShowPOApproval] = useState(false);
  const [poMatches, setPOMatches] = useState<POMatch[]>([]);
  const [hasShownPOApprovalDialog, setHasShownPOApprovalDialog] = useState(false);
  const [lastSeenPODataHash, setLastSeenPODataHash] = useState<string>('');
  const [showUploadedFilesDialog, setShowUploadedFilesDialog] = useState(false);
  
  // Processed invoice state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<ProcessedInvoice | null>(null);
  const [showPagePreview, setShowPagePreview] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch processed invoices
  const { data: processedInvoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['processed-invoices'],
    queryFn: async () => {
      console.log('Fetching invoices from backend...');
      const response = await fetch('http://192.168.1.70:3002/api/invoices');
      const data = await response.json();
      console.log('API response:', data);
      if (data.success) {
        console.log(`Found ${data.invoices.length} invoices`);
        return data.invoices as ProcessedInvoice[];
      } else {
        console.error('API returned error:', data.message);
        return [];
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Calculate summary statistics
  const totalInvoices = processedInvoices?.length || 0;
  const totalValue = processedInvoices?.reduce((sum, invoice) => {
    const amount = parseFloat(invoice.invoiceAmount.replace(/[$,]/g, '')) || 0;
    return sum + amount;
  }, 0) || 0;
  const matchedInvoices = processedInvoices?.filter(invoice => invoice.poNumber)?.length || 0;
  const needReview = totalInvoices - matchedInvoices;

  // Function to refresh uploaded files list
  const refreshUploadedFiles = async () => {
    try {
      const result = await api.getUploadedFiles();
      if (result.success && result.files) {
        setUploadedFiles(result.files);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  // Function to create a hash of vendor matches data to detect changes
  const createDataHash = (matches: VendorMatch[]): string => {
    if (!matches || matches.length === 0) return '';
    
    // Create a hash based on the content of the matches
    const dataString = matches.map(match => 
      `${match.TXT_File}-${match.Vendor_Code}-${match.Vendor_Name}-${match.Address_Match_Score}`
    ).join('|');
    
    console.log('Creating hash from data string:', dataString);
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  // Function to create a hash of PO matches data to detect changes
  const createPODataHash = (matches: POMatch[]): string => {
    if (!matches || matches.length === 0) return '';
    
    // Create a hash based on the content of the matches
    const dataString = matches.map(match => 
      `${match.file_name}-${match.extracted_po_number}-${match.clean_po_number}-${match.Job_Number}`
    ).join('|');
    
    console.log('Creating PO hash from data string:', dataString);
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  // Fetch uploaded files on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const result = await api.getUploadedFiles();
        if (result.success && result.files) {
          setUploadedFiles(result.files);
        }
      } catch (error) {
        console.error('Error fetching uploaded files:', error);
      }
    };
    fetchFiles();
  }, []);

  // Check if processed files exist on component mount
  useEffect(() => {
    const checkProcessedFiles = async () => {
      try {
        const result = await api.checkProcessedFiles();
        if (result.success && result.bothExist) {
          setProcessingComplete(true);
        }
      } catch (error) {
        console.error('Error checking processed files:', error);
      }
    };
    checkProcessedFiles();
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Simulate upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);

      return response;
    },
    onSuccess: (data, file) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      
      // Refresh the uploaded files list
      const fetchFiles = async () => {
        const result = await api.getUploadedFiles();
        if (result.success && result.files) {
          setUploadedFiles(result.files);
        }
      };
      fetchFiles();
      
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error) => {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Upload each file sequentially
      acceptedFiles.forEach((file) => {
        uploadMutation.mutate(file);
      });
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleProcessInvoices = async () => {
    try {
      // Check if uploads folder is empty
      const uploadsCheck = await api.checkUploadsFolder();
      
      if (uploadsCheck.success && uploadsCheck.isEmpty) {
        toast({
          title: "No Files Uploaded",
          description: "Please upload invoice files before processing. The uploads folder is empty.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if there are any PDF files to process
      const pdfFiles = uploadedFiles.filter(file => file.filename.endsWith('.pdf'));
      
      if (pdfFiles.length === 0) {
        toast({
          title: "No PDF Files",
          description: "No PDF files available to process",
          variant: "destructive",
        });
        return;
      }

      // Start processing and show loading animation
      setIsProcessing(true);
      setHasShownApprovalDialog(false); // Reset approval dialog state for new processing
      setHasShownPOApprovalDialog(false); // Reset PO approval dialog state for new processing
      setProcessingComplete(false); // Reset processing complete state
      setVendorMatches([]); // Clear old vendor matches
      setPOMatches([]); // Clear old PO matches
      setShowVendorApproval(false); // Ensure vendor dialog is closed
      setShowPOApproval(false); // Ensure PO dialog is closed
      setProcessingStartTime(Date.now()); // Set processing start time
      setLastSeenDataHash(''); // Reset data hash for new processing
      setLastSeenPODataHash(''); // Reset PO data hash for new processing
      
      // Reset processed count for new processing
      setProcessedCount(0);
      setProcessingProgress(0);

      toast({
        title: "Processing Invoices",
        description: `Starting to process ${pdfFiles.length} PDF files...`,
      });

      // Call the API to process invoices
      const result = await api.processInvoices();
      
      if (result.success) {
        // Keep the loading animation running until approval dialog appears
        // The backend should pause processing and wait for approval
        
        toast({
          title: "Processing Started",
         description: "Processing has started. Waiting for vendor approval...",
        });
        
       console.log('🚀 Processing started, beginning to poll for vendor approval...');
       console.log('⏰ Start time:', new Date().toISOString());
       
       // Start polling for vendor approval ONLY
       // PO approval polling will start AFTER vendor approval is completed
        pollForApproval();
        
      } else {
        toast({
          title: "Processing Failed",
          description: result.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      }

    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process invoices",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const pollForApproval = async () => {
    const checkApproval = async () => {
      try {
        console.log('🔍 Checking approval needed...');
        
        // Also check processing status to understand timing
        const processingStatus = await api.checkProcessingStatus();
        console.log('⚙️ Processing status:', processingStatus);
        
        const result = await api.checkApprovalNeeded();
        console.log('📋 Approval check result:', result);
        
        if (result.success && result.approvalNeeded && result.matches && !hasShownApprovalDialog) {
           console.log('✅ Approval needed detected!');
           console.log('📊 Number of matches found:', result.matches.length);
           console.log('📅 Current time:', new Date().toISOString());
           
           // Check if this is fresh data (not old data from previous runs)
           const currentDataHash = createDataHash(result.matches);
           if (currentDataHash === lastSeenDataHash) {
             console.log('⚠️ Vendor data hash unchanged - this might be old data, continuing to poll...');
             return false; // Continue polling for fresh data
           }
           
           console.log('🎉 Fresh vendor data detected! Hash:', currentDataHash);
           console.log('🎉 Previous hash:', lastSeenDataHash);
           
           // Show approval dialog if backend says approval is needed
           // The backend now handles the timing logic properly
           console.log('🎉 Backend detected approval needed!');
           console.log('🎉 Showing vendor approval dialog with matches:', result.matches);
           console.log('📈 Previous vendor matches count:', vendorMatches.length);
           console.log('⏰ Processing start time:', processingStartTime);
           console.log('⏰ Current time:', Date.now());
           
           // Debug: Log each match to see the data structure
           result.matches.forEach((match, index) => {
             console.log(`Match ${index}:`, match);
             console.log(`  TXT_File: "${match.TXT_File}"`);
             console.log(`  Vendor_Code: "${match.Vendor_Code}"`);
             console.log(`  Vendor_Name: "${match.Vendor_Name}"`);
             console.log(`  Address_Match_Score: "${match.Address_Match_Score}"`);
           });
           
          setVendorMatches(result.matches);
          setShowVendorApproval(true);
          setHasShownApprovalDialog(true); // Mark that we've shown the dialog
           setIsProcessing(false); // Stop the loading animation when dialog appears
           setLastSeenDataHash(currentDataHash); // Store the hash of this data
          return true; // Stop polling
        }
        
        return false; // Continue polling
      } catch (error) {
        console.error('Error checking approval:', error);
        return false;
      }
    };

    // Poll every 2 seconds for up to 10 minutes (slower polling to be more patient)
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes at 2-second intervals
    
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const shouldStop = await checkApproval();
        
        if (shouldStop || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setIsProcessing(false); // Stop loading animation on timeout
          if (attempts >= maxAttempts) {
            toast({
              title: "Processing Timeout",
              description: "Processing is taking longer than expected. Please check the status.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        toast({
          title: "Polling Error",
          description: "Error checking approval status. Please try again.",
          variant: "destructive",
        });
      }
    }, 2000); // Poll every 2 seconds instead of 1 second
  };

  const pollForPOApproval = async () => {
    const checkPOApproval = async () => {
      try {
        console.log('🔍 Checking PO approval needed...');
        
        const result = await api.checkPOApprovalNeeded();
        console.log('📋 PO approval check result:', result);
        
        if (result.success && result.approvalNeeded && result.matches && !hasShownPOApprovalDialog) {
          console.log('✅ PO approval needed detected!');
          console.log('📊 Number of PO matches found:', result.matches.length);
          console.log('📅 Current time:', new Date().toISOString());
          
          // Check if this is fresh data (not old data from previous runs)
          const currentDataHash = createPODataHash(result.matches);
          if (currentDataHash === lastSeenPODataHash) {
            console.log('⚠️ PO data hash unchanged - this might be old data, continuing to poll...');
            return false; // Continue polling for fresh data
          }
          
          console.log('🎉 Fresh PO data detected! Hash:', currentDataHash);
          console.log('🎉 Previous hash:', lastSeenPODataHash);
          
          // Show PO approval dialog if backend says approval is needed
          console.log('🎉 Backend detected PO approval needed!');
          console.log('🎉 Showing PO approval dialog with matches:', result.matches);
          console.log('📈 Previous PO matches count:', poMatches.length);
          
          // Debug: Log each PO match to see the data structure
          result.matches.forEach((match, index) => {
            console.log(`PO Match ${index}:`, match);
            console.log(`  file_name: "${match.file_name}"`);
            console.log(`  extracted_po_number: "${match.extracted_po_number}"`);
            console.log(`  clean_po_number: "${match.clean_po_number}"`);
            console.log(`  Job_Number: "${match.Job_Number}"`);
          });
          
          setPOMatches(result.matches);
          setShowPOApproval(true);
          setHasShownPOApprovalDialog(true); // Mark that we've shown the dialog
          setIsProcessing(false); // Stop the loading animation when dialog appears
          setLastSeenPODataHash(currentDataHash); // Store the hash of this data
          return true; // Stop polling
        }
        
        return false; // Continue polling
      } catch (error) {
        console.error('Error checking PO approval:', error);
        return false;
      }
    };

    // Poll every 2 seconds for up to 10 minutes
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes at 2-second intervals
    
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const shouldStop = await checkPOApproval();
        
        if (shouldStop || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setIsProcessing(false); // Stop loading animation on timeout
          if (attempts >= maxAttempts) {
            toast({
              title: "PO Processing Timeout",
              description: "PO processing is taking longer than expected. Please check the status.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('PO polling error:', error);
        clearInterval(pollInterval);
        toast({
          title: "PO Polling Error",
          description: "Error checking PO approval status. Please try again.",
          variant: "destructive",
        });
      }
    }, 2000); // Poll every 2 seconds
  };

  const pollForProcessingCompletion = async () => {
    const checkCompletion = async () => {
      try {
        console.log('Checking raw PDFs folder status...');
        const result = await api.checkRawPdfs();
        console.log('Raw PDFs check result:', result);
        
        if (result.success && result.isEmpty) {
          // Raw PDFs folder is empty, processing is complete
          console.log('Raw PDFs folder is empty - processing completed successfully');
          setProcessingComplete(true);
          setIsProcessing(false); // Stop the loading animation
          setIsPostApprovalProcessing(false); // Reset post-approval processing state
          setProcessedCount(uploadedFiles.filter(f => f.filename.endsWith('.pdf')).length); // Set processed count
          return true; // Stop polling
        }
        
        // Log current file count for debugging
        if (result.success) {
          console.log(`Raw PDFs folder has ${result.fileCount} files remaining`);
        }
        
        return false; // Continue polling
      } catch (error) {
        console.error('Error checking raw PDFs folder:', error);
        return false;
      }
    };

    // Poll every 2 seconds for up to 15 minutes
    let attempts = 0;
    const maxAttempts = 450; // 15 minutes at 2-second intervals
    
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const shouldStop = await checkCompletion();
        
        if (shouldStop || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setIsProcessing(false); // Stop loading animation
          if (attempts >= maxAttempts) {
            toast({
              title: "Processing Timeout",
              description: "Processing is taking longer than expected. Please check the status.",
              variant: "destructive",
            });
          } else {
            // Processing completed successfully
            toast({
              title: "Processing Complete",
              description: "Your invoices have been processed successfully!",
            });
            
            // Refresh the uploaded files list
            const fetchFiles = async () => {
              try {
                const result = await api.getUploadedFiles();
                if (result.success && result.files) {
                  setUploadedFiles(result.files);
                }
              } catch (error) {
                console.error('Error fetching files after completion:', error);
              }
            };
            fetchFiles();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        toast({
          title: "Polling Error",
          description: "Error checking processing status. Please try again.",
          variant: "destructive",
        });
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleVendorApproval = async (approvedMatches: VendorMatch[]) => {
    try {
      console.log('🚀 Starting vendor approval process...', approvedMatches);
      console.log('📊 Number of approved matches:', approvedMatches.length);
      
      // Send approval to backend to resume processing
      const result = await api.approveVendors(approvedMatches);
      
      console.log('✅ Approval API response:', result);
      
      if (result.success) {
        toast({
          title: "Vendor Matches Approved",
          description: `Successfully approved ${approvedMatches.length} vendor matches. Processing will continue...`,
        });
        
        console.log('🔄 Keeping loading animation running while processing continues...');
        
        // Keep loading animation running while processing continues
        setIsProcessing(true);
        setIsPostApprovalProcessing(true); // Mark that we're in post-approval processing
        
        // Reset approval dialog state
        setHasShownApprovalDialog(false);
        setShowVendorApproval(false);
        setVendorMatches([]); // Clear vendor matches after approval
        setLastSeenDataHash(''); // Reset data hash after approval
        
        console.log('📡 Starting to poll for PO approval...');
        
        // Poll for PO approval (not processing completion)
        pollForPOApproval();
        
      } else {
        console.error('❌ Approval failed:', result.message);
        toast({
          title: "Approval Failed",
          description: result.message || "Failed to approve vendor matches",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error in handleVendorApproval:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve vendor matches",
      });
    }
  };

  const handlePOApproval = async (approvedMatches: POMatch[]) => {
    try {
      console.log('🚀 Starting PO approval process...', approvedMatches);
      console.log('📊 Number of approved PO matches:', approvedMatches.length);
      
      // Send approval to backend to resume processing
      const result = await api.approvePOMatches(approvedMatches);
      
      console.log('✅ PO approval API response:', result);
      
      if (result.success) {
        toast({
          title: "PO Matches Approved",
          description: `Successfully approved ${approvedMatches.length} PO matches. Processing will continue...`,
        });
        
        console.log('🔄 Keeping loading animation running while processing continues...');
        
        // Keep loading animation running while processing continues
        setIsProcessing(true);
        setIsPostApprovalProcessing(true); // Mark that we're in post-approval processing
        
        // Reset approval dialog state
        setHasShownPOApprovalDialog(false);
        setShowPOApproval(false);
        setPOMatches([]); // Clear PO matches after approval
        setLastSeenPODataHash(''); // Reset data hash after approval
        
        console.log('📡 Starting to poll for processing completion...');
        
        // Poll for processing completion
        pollForProcessingCompletion();
        
      } else {
        console.error('❌ PO approval failed:', result.message);
        toast({
          title: "PO Approval Failed",
          description: result.message || "Failed to approve PO matches",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error in handlePOApproval:', error);
      toast({
        title: "PO Approval Failed",
        description: "Failed to approve PO matches",
        variant: "destructive",
      });
    }
  };

  const handleDownloadProcessedFiles = async () => {
    try {
      if (!processingComplete) {
        toast({
          title: "No Processed Files",
          description: "Please process invoices first to generate downloadable files",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Downloading Processed Files",
        description: "Downloading APInvoicesImport1.xlsx and invoice_spectrum_format.txt...",
      });

      // Download both files
      const apInvoicesResult = await api.downloadAPInvoices();
      const spectrumResult = await api.downloadInvoiceSpectrum();

      if (apInvoicesResult.success && spectrumResult.success) {
        toast({
          title: "Download Complete",
          description: "Both processed files have been downloaded successfully!",
        });
      } else {
        const errors = [];
        if (!apInvoicesResult.success) errors.push("APInvoicesImport1.xlsx");
        if (!spectrumResult.success) errors.push("invoice_spectrum_format.txt");
        
        toast({
          title: "Download Partially Failed",
          description: `Failed to download: ${errors.join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download processed files",
        variant: "destructive",
      });
    }
  };

  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all processing folders? This will delete all files from uploads, split_pages, manual_split_pages, OCR_text_Test, processed, and raw_pdfs folders. This action cannot be undone.')) {
      setIsClearing(true);
      try {
        const result = await api.clearProcessingFolders();
        if (result.success) {
          toast({
            title: "All Processing Folders Cleared",
            description: `Successfully cleared ${result.clearedFolders?.length || 0} processing folders: ${result.clearedFolders?.join(', ') || 'uploads, split_pages, manual_split_pages, OCR_text_Test, processed, raw_pdfs'}!`,
          });
          // Refresh the uploaded files
          refreshUploadedFiles();
          // Reset processing states
          setProcessingComplete(false);
          setVendorMatches([]);
          setPOMatches([]);
        } else {
          toast({
            title: "Clear All Failed",
            description: result.message || "Failed to clear all folders.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error clearing all folders:', error);
        toast({
          title: "Clear All Failed",
          description: "Failed to clear all folders.",
          variant: "destructive",
        });
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Loading Animation */}
      <LoadingAnimation 
        isVisible={isProcessing} 
          message={
            showVendorApproval ? 
              "Processing paused - waiting for vendor approval..." :
              showPOApproval ?
                "Processing paused - waiting for PO approval..." :
              isPostApprovalProcessing ?
                "Processing invoices... Please wait while we complete the final steps." :
                "Processing invoices... Please wait while we extract and analyze your documents."
          }
      />
      
      {/* Vendor Approval Dialog */}
      <VendorApprovalDialog
        key={`vendor-dialog-${processingStartTime}`}
        isOpen={showVendorApproval}
        onClose={() => setShowVendorApproval(false)}
        vendorMatches={vendorMatches}
        onApprove={handleVendorApproval}
      />
      
      {/* PO Approval Dialog */}
      <POApprovalDialog
        key={`po-dialog-${processingStartTime}`}
        isOpen={showPOApproval}
        onClose={() => setShowPOApproval(false)}
        poMatches={poMatches}
        onApprove={handlePOApproval}
      />
      
      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />

      <div className="w-full px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invoice Dashboard</h1>
            <p className="text-muted-foreground">
              Upload and manage your invoices with automated processing and PO matching.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={isClearing}
            className="h-9 px-4 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 shadow-sm"
          >
            {isClearing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
            ) : (
              <span>🗑️</span>
            )}
            Clear All
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Upload Section */}
          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? "Drop files here" : "Upload Invoices"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, PNG, JPG (max 10MB per file)
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop files here, or click to select files
                </p>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleProcessInvoices}
                  className="flex-1 shadow-sm hover:shadow-md transition-shadow"
                  variant="default"
                  disabled={uploadedFiles.filter(f => f.filename.endsWith('.pdf')).length === 0 || isProcessing}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Process Invoices"}
                </Button>
                <Button 
                  onClick={handleDownloadProcessedFiles}
                  className="flex-1 shadow-sm hover:shadow-md transition-shadow"
                  variant={processingComplete ? "default" : "outline"}
                  disabled={!processingComplete}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Files
                </Button>
              </div>
              
              {/* View Uploaded Files Button */}
              <div className="mt-3">
                <Button 
                  onClick={() => setShowUploadedFilesDialog(true)}
                  variant="outline"
                  className="w-full shadow-sm hover:shadow-md transition-shadow"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Uploaded Files ({uploadedFiles.length})
                </Button>
              </div>
              
              {/* Page Preview Toggle Button */}
              {uploadedFiles.filter(f => f.filename.toLowerCase().endsWith('.pdf')).length > 0 && (
                <div className="mt-3">
                  <Button 
                    onClick={() => setShowPagePreview(!showPagePreview)}
                    variant="outline"
                    className="w-full shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPagePreview ? 'Hide' : 'Show'} Page Preview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page Preview Section */}
          {showPagePreview && uploadedFiles.filter(f => f.filename.toLowerCase().endsWith('.pdf')).length > 0 && (
            <PagePreview 
              uploadedFiles={uploadedFiles}
              onClose={() => setShowPagePreview(false)}
            />
          )}

          {/* Processed Invoice Section */}
          <Card className="shadow-lg border-border bg-gradient-to-br from-background to-muted/20 w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    Processed Invoices
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    View and manage all processed invoices in the system
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Live Updates
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by invoice number or vendor name..."
                    className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    <select className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                      <option>All Statuses</option>
                      <option>Matched</option>
                      <option>Review Needed</option>
                      <option>Processing</option>
                    </select>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2 px-4 py-3 hover:bg-primary hover:text-primary-foreground transition-all">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </Button>
                </div>
              </div>

              {/* Invoice Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
                <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-4 border-b border-border">
                  <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-foreground">
                    <div>Invoice Number</div>
                    <div>Vendor</div>
                    <div>Vendor Name</div>
                    <div>PO Number</div>
                    <div>Date</div>
                    <div>Amount</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground px-6 py-2 bg-muted/20 border-b border-border">
                  💡 Click on any invoice row to view detailed information
                </div>
                {invoicesLoading ? (
                  <div className="p-12 text-center bg-gradient-to-b from-background to-muted/10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground mb-2">Loading invoices...</p>
                        <p className="text-muted-foreground">Fetching processed invoice data</p>
                      </div>
                    </div>
                  </div>
                ) : invoicesError ? (
                  <div className="p-12 text-center bg-[#242424] border border-[#2F2F2F] rounded-xl">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-[#2F2F2F] rounded-full">
                        <svg className="h-8 w-8 text-[#A0A0A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white mb-2">Error loading invoices</p>
                        <p className="text-[#A0A0A0]">{invoicesError.message}</p>
                      </div>
                    </div>
                  </div>
                ) : processedInvoices && processedInvoices.length > 0 ? (
                  <div className="divide-y divide-border">
                    {processedInvoices.map((invoice) => (
                      <div 
                        key={invoice.id} 
                        className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <div className="grid grid-cols-6 gap-4 text-sm items-center">
                          <div className="font-medium text-foreground">
                            {invoice.invoiceNumber || 'N/A'}
                          </div>
                          <div className="text-muted-foreground">
                            {invoice.vendorCode || 'N/A'}
                          </div>
                          <div className="text-muted-foreground">
                            {invoice.vendorName || 'N/A'}
                          </div>
                          <div className="text-muted-foreground">
                            {(() => {
                              const parts = [];
                              if (invoice.poNumber) parts.push(`PO: ${invoice.poNumber}`);
                              if (invoice.jobNumber) parts.push(`Job: ${invoice.jobNumber}`);
                              if (invoice.woNumber) parts.push(`WO: ${invoice.woNumber}`);
                              if (invoice.remarks) parts.push(`Remarks: ${invoice.remarks}`);
                              return parts.length > 0 ? parts.join(' | ') : 'N/A';
                            })()}
                          </div>
                          <div className="text-muted-foreground">
                            {invoice.invoiceDate || 'N/A'}
                          </div>
                          <div className="font-medium text-foreground flex items-center justify-between">
                            ${parseFloat(invoice.invoiceAmount || '0').toFixed(2)}
                            <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-gradient-to-b from-background to-muted/10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground mb-2">No invoices found</p>
                        <p className="text-muted-foreground">Upload and process invoices to see them here</p>
                        <p className="text-xs text-muted-foreground mt-2">Check browser console for API response details</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{totalInvoices}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Invoices</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{matchedInvoices}</div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium">Matched</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-orange-600">{needReview}</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">Need Review</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">${totalValue.toFixed(2)}</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files Dialog */}
          <UploadedFilesDialog
            isOpen={showUploadedFilesDialog}
            onClose={() => setShowUploadedFilesDialog(false)}
            uploadedFiles={uploadedFiles}
            onFileDeleted={refreshUploadedFiles}
          />

        </div>
      </div>
    </div>
  );
}