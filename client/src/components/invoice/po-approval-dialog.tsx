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
  const [editedMatches, setEditedMatches] = useState<POMatch[]>([]);
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
