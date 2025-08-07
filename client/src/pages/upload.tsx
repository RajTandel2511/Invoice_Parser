import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText, Download, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import VendorApprovalDialog from '@/components/invoice/vendor-approval-dialog';
import POApprovalDialog from '@/components/invoice/po-approval-dialog';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
         description: "Processing has started. Waiting for vendor and PO approval...",
       });
       
       console.log('🚀 Processing started, beginning to poll for vendor and PO approval...');
       console.log('⏰ Start time:', new Date().toISOString());
       
       // Start polling for both vendor and PO approval needed
       pollForApproval();
       pollForPOApproval();
        
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
        
        console.log('📡 Starting to poll for processing completion...');
        
        // Poll for processing completion
        pollForProcessingCompletion();
        
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
        variant: "destructive",
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
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Invoice Dashboard</h1>
          <p className="text-muted-foreground">
            Upload and manage your invoices with automated processing and PO matching.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Upload Section */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
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
                  className="flex-1"
                  variant="default"
                  disabled={uploadedFiles.filter(f => f.filename.endsWith('.pdf')).length === 0 || isProcessing}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Process Invoices"}
                </Button>
                <Button 
                  onClick={handleDownloadProcessedFiles}
                  className="flex-1"
                  variant={processingComplete ? "default" : "outline"}
                  disabled={!processingComplete}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Files ({uploadedFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {file.filename.endsWith('.pdf') ? 'PDF' : 'Image'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Status */}
          {processingComplete && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Processing Complete</h3>
                    <p className="text-sm text-green-700">
                      Your invoices have been processed successfully. You can now download the processed files.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}