import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Download, Eye } from "lucide-react";
import { type Invoice } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'matched':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Matched</Badge>;
    case 'review_needed':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Review Needed</Badge>;
    case 'not_matched':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Not Matched</Badge>;
    case 'pending':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Processing</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          Processed Invoices
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage all processed invoices in the system
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8 shadow-sm border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or vendor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="review_needed">Review Needed</SelectItem>
                <SelectItem value="not_matched">Not Matched</SelectItem>
                <SelectItem value="pending">Processing</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
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
                  <TableHead className="font-semibold">Invoice Number</TableHead>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">PO Number</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.vendorName}</TableCell>
                    <TableCell>{invoice.poNumber || "-"}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredInvoices.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No invoices found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-foreground">{invoices.length}</div>
            <p className="text-muted-foreground text-sm">Total Invoices</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter(i => i.status === 'matched').length}
            </div>
            <p className="text-muted-foreground text-sm">Matched</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {invoices.filter(i => i.status === 'review_needed').length}
            </div>
            <p className="text-muted-foreground text-sm">Need Review</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(
                invoices.reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0)
              )}
            </div>
            <p className="text-muted-foreground text-sm">Total Value</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}