import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  FileText, 
  Image, 
  Download, 
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface ExtractedInvoice {
  id: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
  attachmentName: string;
  attachmentType: string;
  attachmentData: string;
  mimeType: string;
  isImage: boolean;
  isPDF: boolean;
}

export default function ExtractedInvoicesDisplay() {
  const [invoices, setInvoices] = useState<ExtractedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtractedInvoice | null>(null);
  const { toast } = useToast();

  // Function to get friendly name from email address
  const getFriendlyName = (email: string): string => {
    const emailMap: { [key: string]: string } = {
      'raj2511tandel@gmail.com': 'Raj Tandel',
      'janene@allairmechanical.com': 'Janene Borromeo',
      'payal@allairmechanical.com': 'Payal Tandel',
      'yogita@allairmechanical.com': 'Yogita Tandel'
    };
    return emailMap[email] || email;
  };

  useEffect(() => {
    fetchInvoices();
    // Refresh every 30 seconds to get new invoices
    const interval = setInterval(fetchInvoices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInvoices = async () => {
    try {
      // Use the proper API base URL
      const response = await fetch('http://192.168.1.70:3002/api/email-monitor/invoices');
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const clearEmailAttachments = async () => {
    if (!confirm('Are you sure you want to clear the email_attachments folder? This will remove all extracted email attachments.')) return;
    
    setIsLoading(true);
    try {
      const result = await api.clearEmailAttachments();
      
      if (result.success) {
        // Clear the extracted invoices display to match the cleared folder
        setInvoices([]);
        setSelectedInvoice(null);
        
        // Refresh the display to ensure it's in sync with the server
        fetchInvoices();
        
        toast({
          title: "Email Attachments Cleared",
          description: `Successfully cleared email_attachments folder and removed all extracted invoices from display`,
        });
      } else {
        toast({
          title: "Clear Failed",
          description: result.message || "Failed to clear email attachments folder",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear email attachments folder",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToUploads = async () => {
    if (invoices.length === 0) {
      toast({
        title: "No Invoices to Export",
        description: "There are no extracted invoices to transfer",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to transfer ${invoices.length} invoice(s) from email_attachments to uploads folder?`)) {
      return;
    }

    setIsExporting(true);
    try {
      const result = await api.moveEmailAttachments();
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: `${result.totalFiles || invoices.length} invoice(s) transferred to uploads folder`,
        });
        
        // Clear the extracted invoices display
        setInvoices([]);
        setSelectedInvoice(null);
        
        // Refresh the display to ensure it's in sync with the server
        fetchInvoices();
        
        // Redirect to main page after a short delay
        setTimeout(() => {
          window.location.href = 'http://192.168.1.70:3000/';
        }, 1500);
      } else {
        toast({
          title: "Export Failed",
          description: result.message || "Failed to transfer invoices",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to transfer invoices to uploads folder",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAttachment = (invoice: ExtractedInvoice) => {
    try {
      const byteCharacters = atob(invoice.attachmentData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const blob = new Blob([byteArray], { type: invoice.mimeType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = invoice.attachmentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${invoice.attachmentName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download attachment",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  const getFileIcon = (invoice: ExtractedInvoice) => {
    if (invoice.isPDF) return <FileText className="h-5 w-5 text-red-500" />;
    if (invoice.isImage) return <Image className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getFileTypeBadge = (invoice: ExtractedInvoice) => {
    if (invoice.isPDF) return <Badge variant="destructive">PDF</Badge>;
    if (invoice.isImage) return <Badge variant="default">Image</Badge>;
    return <Badge variant="secondary">{invoice.attachmentType.toUpperCase()}</Badge>;
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Extracted Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No invoices extracted yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Invoices sent FROM authorized senders TO fetcherinvoice@gmail.com will appear here automatically
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Authorized senders: Raj Tandel, Janene Borromeo, Payal Tandel, Yogita Tandel
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Extracted Invoices</h2>
          <p className="text-muted-foreground">
            {invoices.length} invoice(s) extracted from emails sent by authorized senders to fetcherinvoice@gmail.com
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchInvoices}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportToUploads}
            disabled={isLoading || isExporting || invoices.length === 0}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className={`h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export to Uploads'}
          </Button>
          <Button
            onClick={clearEmailAttachments}
            disabled={isLoading}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Email Attachments
          </Button>
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(invoice)}
                  <div>
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {invoice.attachmentName}
                    </CardTitle>
                    {getFileTypeBadge(invoice)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Email Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{getFriendlyName(invoice.emailFrom)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(invoice.emailDate)}</span>
                  </div>
                </div>
                
                {/* Email Subject */}
                <div className="text-sm">
                  <p className="font-medium text-foreground">Subject:</p>
                  <p className="text-muted-foreground line-clamp-2">{invoice.emailSubject}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setSelectedInvoice(invoice)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    onClick={() => downloadAttachment(invoice)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{selectedInvoice.attachmentName}</h3>
                <p className="text-sm text-muted-foreground">{selectedInvoice.emailSubject}</p>
                <p className="text-xs text-muted-foreground">From: {getFriendlyName(selectedInvoice.emailFrom)}</p>
              </div>
              <Button
                onClick={() => setSelectedInvoice(null)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              {selectedInvoice.isImage ? (
                <img
                  src={`data:${selectedInvoice.mimeType};base64,${selectedInvoice.attachmentData}`}
                  alt={selectedInvoice.attachmentName}
                  className="max-w-full h-auto mx-auto"
                />
              ) : selectedInvoice.isPDF ? (
                <iframe
                  src={`data:${selectedInvoice.mimeType};base64,${selectedInvoice.attachmentData}`}
                  className="w-full h-[70vh] border rounded"
                  title={selectedInvoice.attachmentName}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Preview not available for {selectedInvoice.attachmentType} files
                  </p>
                  <Button
                    onClick={() => downloadAttachment(selectedInvoice)}
                    className="mt-4"
                  >
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
