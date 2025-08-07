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
import { Check, X, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);
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

  // Reset selected matches when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMatches(new Set());
      setIsApproving(false);
    }
  }, [isOpen]);

  const handleToggleMatch = (txtFile: string) => {
    if (!txtFile) {
      console.log('handleToggleMatch called with empty txtFile');
      return;
    }
    
    console.log('Toggling match for:', txtFile);
    console.log('Current selected matches:', Array.from(selectedMatches));
    
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(txtFile)) {
      newSelected.delete(txtFile);
      console.log('Removed from selection:', txtFile);
    } else {
      newSelected.add(txtFile);
      console.log('Added to selection:', txtFile);
    }
    setSelectedMatches(newSelected);
    console.log('Updated selected matches:', Array.from(newSelected));
  };

  const handleApproveAll = () => {
    console.log('Approve All clicked');
    const allTxtFiles = vendorMatches
      .map(match => match.TXT_File)
      .filter(Boolean) as string[];
    console.log('All TXT files:', allTxtFiles);
    setSelectedMatches(new Set(allTxtFiles));
  };

  const handleRejectAll = () => {
    console.log('Reject All clicked');
    setSelectedMatches(new Set());
  };

  const handleConfirm = async () => {
    console.log('Confirm button clicked');
    console.log('Selected matches:', Array.from(selectedMatches));
    console.log('Available vendor matches:', vendorMatches);
    
    const approvedMatches = vendorMatches.filter(match => 
      match.TXT_File && selectedMatches.has(match.TXT_File)
    );

    console.log('Approved matches to send:', approvedMatches);
    console.log('Number of approved matches:', approvedMatches.length);

    if (approvedMatches.length === 0) {
      toast({
        title: "No Matches Selected",
        description: "Please select at least one vendor match to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    
    try {
      console.log('Calling onApprove with:', approvedMatches);
      await onApprove(approvedMatches);
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

  // Don't render anything if dialog is not open
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Vendor Match Approval
          </DialogTitle>
          <DialogDescription>
            Processing has been paused. Review and approve the automatically matched vendors for your invoices. 
            Processing will continue after you approve the matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vendor Matches List */}
          <div className="space-y-3">
            {vendorMatches && vendorMatches.length > 0 ? vendorMatches.map((match, index) => {
              const txtFile = match.TXT_File;
              const isSelected = txtFile ? selectedMatches.has(txtFile) : false;
              
              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => txtFile && handleToggleMatch(txtFile)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => txtFile && handleToggleMatch(txtFile)}
                        className="rounded border-gray-300"
                        disabled={!txtFile}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Single row with the three key fields */}
                      <div className="flex-1 grid grid-cols-3 gap-6">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">File</div>
                          <div className="font-semibold text-base">
                            {txtFile ? txtFile.replace('.txt', '') : 'Unknown File'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Vendor Code</div>
                          <div className="font-semibold text-base">
                            {match.Vendor_Code || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Vendor Name</div>
                          <div className="font-semibold text-base">
                            {match.Vendor_Name || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Match score badge */}
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getMatchScoreColor(match.Address_Match_Score)}>
                          {match.Address_Match_Score || '0'}% Match
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No vendor matches available</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isApproving}
            className="hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedMatches.size === 0 || isApproving}
            className="bg-green-600 hover:bg-green-700"
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
