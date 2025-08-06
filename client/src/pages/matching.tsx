import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Invoice } from "@shared/schema";
import { mockApiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, DollarSign, Calendar } from "lucide-react";

export default function Matching() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: mockApiRequest.getInvoices,
  });

  const matchMutation = useMutation({
    mutationFn: async ({ invoiceId, poNumber }: { invoiceId: string; poNumber: string }) => {
      const response = await mockApiRequest.matchPO(invoiceId, poNumber);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "PO Matching Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return <Badge className="bg-green-100 text-green-800">Matched</Badge>;
      case "review_needed":
        return <Badge className="bg-yellow-100 text-yellow-800">Review Needed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PO Matching</h1>
          <p className="text-muted-foreground">
            Match invoices with purchase orders for automated processing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Unmatched Invoices
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading invoices...</p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No unmatched invoices found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedInvoice?.id === invoice.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                            <p className="text-sm text-muted-foreground">{invoice.vendorName}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {invoice.totalAmount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(invoice.invoiceDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* PO Matching Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>PO Matching</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedInvoice ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Selected Invoice</h3>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{selectedInvoice.vendorName}</p>
                        <p className="text-sm text-muted-foreground">
                          Amount: ${selectedInvoice.totalAmount}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">PO Number</label>
                      <Input
                        placeholder="Enter PO number..."
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleMatch}
                      disabled={!poNumber || matchMutation.isPending}
                      className="w-full"
                    >
                      {matchMutation.isPending ? "Matching..." : "Match PO"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select an invoice to match</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}