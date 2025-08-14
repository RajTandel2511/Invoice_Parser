"use client"

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, X, AlertCircle, CheckCircle, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

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

interface POApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  poMatches: POMatch[];
  onApprove: (approvedMatches: POMatch[]) => void;
}

export default function POApprovalDialog({
  isOpen,
  onClose,
  poMatches,
  onApprove
}: POApprovalDialogProps) {
  const [editedMatches, setEditedMatches] = useState<POMatch[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { toast } = useToast();

  // Debug logging
  console.log('POApprovalDialog render:', { isOpen, poMatches: poMatches?.length });
  
  // Log when PO matches change
  useEffect(() => {
    if (isOpen && poMatches && poMatches.length > 0) {
      console.log('POApprovalDialog received new matches:', poMatches);
      
      // Debug: Log each match in detail
      poMatches.forEach((match, index) => {
        console.log(`Dialog PO Match ${index}:`, match);
        console.log(`  file_name: "${match.file_name}"`);
        console.log(`  extracted_po_number: "${match.extracted_po_number}"`);
        console.log(`  clean_po_number: "${match.clean_po_number}"`);
        console.log(`  PO_Number: "${match.PO_Number}"`);
        console.log(`  Job_Number: "${match.Job_Number}"`);
        console.log(`  WO_Number: "${match.WO_Number}"`);
        console.log(`  Remarks: "${match.Remarks}"`);
        console.log(`  po_verified_by: "${match.po_verified_by}"`);
        console.log(`  job_verified_by: "${match.job_verified_by}"`);
      });
    }
  }, [isOpen, poMatches]);

  // Initialize edited matches when dialog opens
  useEffect(() => {
    if (isOpen && poMatches) {
      setEditedMatches([...poMatches]);
      setIsApproving(false);
    }
  }, [isOpen, poMatches]);

  const handleUpdateMatch = (index: number, field: keyof POMatch, value: string) => {
    console.log('Updating PO match:', index, field, value);
    
    const updatedMatches = [...editedMatches];
    updatedMatches[index] = {
      ...updatedMatches[index],
      [field]: value
    };
    setEditedMatches(updatedMatches);
  };

  const handleConfirm = async () => {
    console.log('Confirm button clicked');
    console.log('Edited matches:', editedMatches);
    
    if (editedMatches.length === 0) {
      toast({
        title: "No PO matches available",
        description: "No PO matches available to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    
    try {
      console.log('Approved PO matches:', editedMatches);
      
      await onApprove(editedMatches);
      
      toast({
        title: "PO matches approved successfully",
        description: `${editedMatches.length} PO match(es) have been approved.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error approving PO matches:', error);
      toast({
        title: "Error approving PO matches",
        description: "Failed to approve PO matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const getVerificationStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status.includes('ERROR')) return 'bg-red-100 text-red-800';
    if (status.includes('Found') || status.includes('Verified')) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getVerificationStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="h-4 w-4" />;
    if (status.includes('ERROR')) return <X className="h-4 w-4" />;
    if (status.includes('Found') || status.includes('Verified')) return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const openBlobInNewTab = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      // Prevent the new window from having access to the opener for security
      win.opener = null;
    }
    // Revoke after some time to let the tab load fully
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handlePreviewAllFiles = async () => {
    try {
      setIsPreviewLoading(true);
      
      // Get files from raw_pdfs directory (where processed files are stored)
      const result = await api.getRawPdfFiles();
      
      console.log('Raw PDF files result:', result);
      
      if (!result.success || !result.files || result.files.length === 0) {
        toast({
          title: "No Files Found",
          description: "No processed files found to preview.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Files found:', result.files);
      
      // Convert full paths to relative paths that the server can use
      const filePaths = result.files.map((f: any) => {
        // Extract just the filename from the full path
        const filename = f.filename || f.name || f;
        // Use the process/data/raw_pdfs directory path (relative to server root)
        return `process/data/raw_pdfs/${filename}`;
      });
      
      console.log('File paths to merge:', filePaths);
      
      const mergedBlob = await api.mergePDFs(filePaths);
      if (mergedBlob) {
        console.log('Successfully merged PDF, opening in new tab');
        openBlobInNewTab(mergedBlob, 'all_processed_files.pdf');
      } else {
        console.error('Failed to merge PDFs - no blob returned');
        toast({
          title: "Preview Failed",
          description: "Could not merge PDF files for preview.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Preview all files error:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to open preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PO Number Verification Required
          </DialogTitle>
          <DialogDescription>
            Please review and approve the PO information. You can edit the PO Number, Job Number, WO Number, and Remarks if needed. 
            <strong>Note: You must click "Approve All" or "Cancel" to continue processing.</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">
              Processing is paused. You must approve or cancel to continue.
            </span>
          </div>
        </div>

        {/* Preview Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewAllFiles}
            disabled={isPreviewLoading}
            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
          >
            {isPreviewLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Preview All Files
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {editedMatches && editedMatches.length > 0 ? (
            editedMatches.map((match, index) => {
              const fileName = match.file_name || `Match ${index + 1}`;
              
              return (
                <Card 
                  key={`${fileName}-${index}`} 
                  className="border border-border"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {fileName ? fileName.replace('.pdf', '') : 'Unknown File'}
                    </CardTitle>
                    {match.extracted_po_number && (
                      <p className="text-xs text-muted-foreground">
                        Extracted PO: {match.extracted_po_number}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          PO Number
                        </label>
                        <Input
                          value={match.PO_Number || ''}
                          onChange={(e) => handleUpdateMatch(index, 'PO_Number', e.target.value)}
                          className="text-sm"
                          placeholder="Enter PO number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Job Number
                        </label>
                        <Input
                          value={match.Job_Number || ''}
                          onChange={(e) => handleUpdateMatch(index, 'Job_Number', e.target.value)}
                          className="text-sm"
                          placeholder="Enter job number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          WO Number
                        </label>
                        <Input
                          value={match.WO_Number || ''}
                          onChange={(e) => handleUpdateMatch(index, 'WO_Number', e.target.value)}
                          className="text-sm"
                          placeholder="Enter WO number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Remarks
                        </label>
                        <Input
                          value={match.Remarks || ''}
                          onChange={(e) => handleUpdateMatch(index, 'Remarks', e.target.value)}
                          className="text-sm"
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No PO matches found to review.
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={editedMatches.length === 0 || isApproving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isApproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve All ({editedMatches.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
