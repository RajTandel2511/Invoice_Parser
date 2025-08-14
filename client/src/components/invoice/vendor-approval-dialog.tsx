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
import { Check, X, AlertCircle, CheckCircle, Building2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

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

interface VendorApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendorMatches: VendorMatch[];
  onApprove: (approvedMatches: VendorMatch[]) => void;
}

export default function VendorApprovalDialog({
  isOpen,
  onClose,
  vendorMatches,
  onApprove
}: VendorApprovalDialogProps) {
  const [editedMatches, setEditedMatches] = useState<VendorMatch[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { toast } = useToast();

  // Debug logging
  console.log('VendorApprovalDialog render:', { isOpen, vendorMatches: vendorMatches?.length });
  
  // Log when vendor matches change
  useEffect(() => {
    if (isOpen && vendorMatches && vendorMatches.length > 0) {
      console.log('VendorApprovalDialog received new matches:', vendorMatches);
      
      // Debug: Log each match in detail
      vendorMatches.forEach((match, index) => {
        console.log(`Dialog Match ${index}:`, match);
        console.log(`  TXT_File: "${match.TXT_File}"`);
        console.log(`  Vendor_Code: "${match.Vendor_Code}"`);
        console.log(`  Vendor_Name: "${match.Vendor_Name}"`);
        console.log(`  Address_Match_Score: "${match.Address_Match_Score}"`);
      });
    }
  }, [isOpen, vendorMatches]);

  // Reset edited matches when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditedMatches([...vendorMatches]);
      setIsApproving(false);
    }
  }, [isOpen, vendorMatches]);

  const handleUpdateMatch = (index: number, field: keyof VendorMatch, value: string) => {
    console.log('Updating match:', index, field, value);
    
    const updatedMatches = [...editedMatches];
    updatedMatches[index] = {
      ...updatedMatches[index],
      [field]: value
    };
    setEditedMatches(updatedMatches);
    console.log('Updated matches:', updatedMatches);
  };

  const handleApproveAll = () => {
    console.log('Approve All clicked');
    // All matches are automatically approved when dialog opens
  };

  const handleRejectAll = () => {
    console.log('Reject All clicked');
    // Reset to original data
    setEditedMatches([...vendorMatches]);
  };

  const handleConfirm = async () => {
    console.log('Confirm button clicked');
    console.log('Edited matches to send:', editedMatches);
    console.log('Number of edited matches:', editedMatches.length);

    if (editedMatches.length === 0) {
      toast({
        title: "No Matches Available",
        description: "No vendor matches available to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    
    try {
      console.log('Calling onApprove with:', editedMatches);
      await onApprove(editedMatches);
      console.log('Approval successful, closing dialog');
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      setIsApproving(false);
      toast({
        title: "Approval Failed",
        description: "Failed to approve vendor matches. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMatchScoreColor = (score?: string) => {
    if (!score) return "bg-gray-100 text-gray-800";
    const numScore = parseInt(score);
    if (isNaN(numScore)) return "bg-gray-100 text-gray-800";
    if (numScore >= 90) return "bg-green-100 text-green-800";
    if (numScore >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getMatchTypeIcon = (matchBy?: string) => {
    if (!matchBy) return <AlertCircle className="h-4 w-4 text-gray-600" />;
    if (matchBy.includes("contact + address")) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (matchBy.includes("address only")) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-blue-600" />;
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

  // Don't render anything if dialog is not open
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vendor Match Approval
          </DialogTitle>
          <DialogDescription>
            Please review and approve the vendor matches. You can edit the Vendor Code and Vendor Name if needed. 
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
              const txtFile = match.TXT_File;
              
              return (
                <Card 
                  key={index}
                  className="border border-border"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {txtFile ? txtFile.replace('.txt', '') : 'Unknown File'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getMatchScoreColor(match.Address_Match_Score)}>
                        {match.Address_Match_Score || '0'}% Match
                      </Badge>
                      {match.Matched_By && (
                        <span className="text-xs text-muted-foreground">
                          • {match.Matched_By}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Vendor Code
                        </label>
                        <Input
                          value={match.Vendor_Code || ''}
                          onChange={(e) => handleUpdateMatch(index, 'Vendor_Code', e.target.value)}
                          className="text-sm"
                          placeholder="Enter vendor code"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Vendor Name
                        </label>
                        <Input
                          value={match.Vendor_Name || ''}
                          onChange={(e) => handleUpdateMatch(index, 'Vendor_Name', e.target.value)}
                          className="text-sm"
                          placeholder="Enter vendor name"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No vendor matches found to review.
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
