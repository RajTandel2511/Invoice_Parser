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
import { Check, X, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);
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

  // Reset selected matches when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMatches(new Set());
      setIsApproving(false);
    }
  }, [isOpen]);

  const handleToggleMatch = (fileName: string) => {
    if (!fileName) {
      console.log('handleToggleMatch called with empty fileName');
      return;
    }
    
    console.log('Toggling PO match for:', fileName);
    console.log('Current selected matches:', Array.from(selectedMatches));
    
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
      console.log('Removed from selection:', fileName);
    } else {
      newSelected.add(fileName);
      console.log('Added to selection:', fileName);
    }
    setSelectedMatches(newSelected);
    console.log('Updated selected matches:', Array.from(newSelected));
  };

  const handleConfirm = async () => {
    console.log('Confirm button clicked');
    console.log('Selected matches:', Array.from(selectedMatches));
    
    if (selectedMatches.size === 0) {
      toast({
        title: "No PO matches selected",
        description: "Please select at least one PO match to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    
    try {
      const approvedMatches = poMatches.filter(match => 
        match.file_name && selectedMatches.has(match.file_name)
      );
      
      console.log('Approved PO matches:', approvedMatches);
      
      await onApprove(approvedMatches);
      
      toast({
        title: "PO matches approved successfully",
        description: `${approvedMatches.length} PO match(es) have been approved.`,
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PO Number Verification Required
          </DialogTitle>
          <DialogDescription>
            Please review and approve the extracted PO numbers. Select the matches you want to approve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {poMatches && poMatches.length > 0 ? (
            poMatches.map((match, index) => {
              const fileName = match.file_name || `Match ${index + 1}`;
              const isSelected = selectedMatches.has(fileName);
              
              return (
                <Card 
                  key={`${fileName}-${index}`} 
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => fileName && handleToggleMatch(fileName)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => fileName && handleToggleMatch(fileName)}
                        className="rounded border-gray-300"
                        disabled={!fileName}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Responsive layout with proper text wrapping */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1">File</div>
                          <div className="font-semibold text-sm break-all">
                            {fileName ? fileName.replace('.pdf', '') : 'Unknown File'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Extracted PO</div>
                          <div className="font-semibold text-sm break-words">
                            {match.extracted_po_number || 'N/A'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Clean PO</div>
                          <div className="font-semibold text-sm break-words">
                            {match.clean_po_number || 'N/A'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Job Number</div>
                          <div className="font-semibold text-sm break-words">
                            {match.Job_Number || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Verification status badges */}
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getVerificationStatusColor(match.po_verified_by)}>
                          <div className="flex items-center gap-1">
                            {getVerificationStatusIcon(match.po_verified_by)}
                            PO: {match.po_verified_by || 'Not Verified'}
                          </div>
                        </Badge>
                        <Badge className={getVerificationStatusColor(match.job_verified_by)}>
                          <div className="flex items-center gap-1">
                            {getVerificationStatusIcon(match.job_verified_by)}
                            Job: {match.job_verified_by || 'Not Verified'}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Additional details in a collapsible section */}
                    {(match.PO_Number || match.WO_Number || match.Remarks) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {match.PO_Number && (
                            <div>
                              <span className="text-muted-foreground">PO Number:</span>
                              <span className="ml-2 font-medium">{match.PO_Number}</span>
                            </div>
                          )}
                          {match.WO_Number && (
                            <div>
                              <span className="text-muted-foreground">WO Number:</span>
                              <span className="ml-2 font-medium">{match.WO_Number}</span>
                            </div>
                          )}
                          {match.Remarks && (
                            <div>
                              <span className="text-muted-foreground">Remarks:</span>
                              <span className="ml-2 font-medium">{match.Remarks}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
            className="hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedMatches.size === 0 || isApproving}
            className="hover:bg-green-50 hover:border-green-200"
          >
            {isApproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve Selected ({selectedMatches.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
