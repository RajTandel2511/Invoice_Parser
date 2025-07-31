import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Link2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { type Invoice } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Matching() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const matchMutation = useMutation({
    mutationFn: async ({ invoiceId, poNumber }: { invoiceId: string; poNumber: string }) => {
      const response = await apiRequest("POST", "/api/match", { invoiceId, poNumber });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "PO Matching Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setSelectedInvoice(null);
      setPoNumber("");
    },
    onError: (error) => {
      toast({
        title: "Matching Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unmatchedInvoices = invoices.filter(invoice => 
    !invoice.poNumber || invoice.status === 'not_matched'
  );

  const filteredInvoices = unmatchedInvoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMatch = () => {
    if (selectedInvoice && poNumber) {
      matchMutation.mutate({ invoiceId: selectedInvoice.id, poNumber });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'review_needed':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'not_matched':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          PO Matching
        </h1>
        <p className="text-muted-foreground mt-2">
          Match invoices with purchase orders to validate amounts and approve payments
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {unmatchedInvoices.length}
                </div>
                <p className="text-muted-foreground text-sm">Unmatched Invoices</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {invoices.filter(i => i.status === 'matched').length}
                </div>
                <p className="text-muted-foreground text-sm">Successfully Matched</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {invoices.filter(i => i.status === 'review_needed').length}
                </div>
                <p className="text-muted-foreground text-sm">Need Review</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-8 shadow-sm border-border">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search unmatched invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Unmatched Invoices Table */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link2 className="h-5 w-5" />
            <span>Invoices Requiring PO Matching</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded-xl bg-muted h-12 w-12"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Invoice Number</TableHead>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Current PO</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.status)}
                        <Badge variant={invoice.status === 'not_matched' ? 'destructive' : 'secondary'}>
                          {invoice.status === 'not_matched' ? 'No Match' : 'Pending'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.vendorName}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{invoice.poNumber || "-"}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedInvoice(invoice)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Match PO
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Match Purchase Order</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-xl">
                              <h4 className="font-semibold text-foreground mb-2">Invoice Details</h4>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Invoice:</span> {selectedInvoice?.invoiceNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Vendor:</span> {selectedInvoice?.vendorName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Amount:</span> {selectedInvoice && formatCurrency(selectedInvoice.totalAmount)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground">
                                Purchase Order Number
                              </label>
                              <Input
                                placeholder="Enter PO number..."
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => {
                                setSelectedInvoice(null);
                                setPoNumber("");
                              }}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleMatch}
                                disabled={!poNumber || matchMutation.isPending}
                                className="bg-primary hover:bg-primary/90"
                              >
                                {matchMutation.isPending ? "Matching..." : "Match PO"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredInvoices.length === 0 && (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">All invoices have been matched with purchase orders.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}