import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Edit, RotateCcw, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { type Invoice, insertInvoiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStatusInfo, formatCurrency, formatDate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'matched':
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'review_needed':
      return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    case 'not_matched':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

interface DetailPanelProps {
  invoice: Invoice;
  onInvoiceUpdate: () => void;
  onClose: () => void;
}

export default function DetailPanel({
  invoice,
  onInvoiceUpdate,
  onClose,
}: DetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertInvoiceSchema.partial()),
    defaultValues: {
      invoiceNumber: invoice.invoiceNumber,
      poNumber: invoice.poNumber || "",
      vendorName: invoice.vendorName,
      vendorId: invoice.vendorId || "",
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/invoices/${invoice.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Updated",
        description: "Invoice has been updated successfully.",
      });
      setIsEditing(false);
      onInvoiceUpdate();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invoices/${invoice.id}/reprocess`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reprocessing Started",
        description: data.message,
      });
      onInvoiceUpdate();
    },
    onError: (error) => {
      toast({
        title: "Reprocess Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const statusInfo = getStatusInfo(invoice.status as any);
  const discrepancy = invoice.poAmount 
    ? parseFloat(invoice.totalAmount) - parseFloat(invoice.poAmount)
    : 0;

  return (
    <div className="w-1/2 border-l border-border bg-background overflow-y-auto">
      <div className="p-8">
        {/* Invoice Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              {invoice.invoiceNumber}
            </h2>
            <p className="text-muted-foreground mt-1">{invoice.vendorName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${statusInfo.color}`}
            >
              {getStatusIcon(invoice.status)}
              <span className="ml-2">{statusInfo.label}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formatDate(invoice.invoiceDate)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={invoice.dueDate ? formatDate(invoice.dueDate) : ""}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Vendor Information */}
            <Card>
              <CardContent className="p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vendorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor ID</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!isEditing}
                      className="border-2 brand-border-500 font-semibold text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PO Matching Status */}
            {invoice.poAmount && (
              <Card>
                <CardContent
                  className={`p-4 ${
                    invoice.status === "review_needed"
                      ? "bg-yellow-50 border-yellow-200"
                      : invoice.status === "matched"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-800">
                      PO Matching Status
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                    >
                      <i className={`${statusInfo.icon} mr-1`}></i>
                      {discrepancy !== 0 ? "Discrepancy Detected" : "Matched"}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PO Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.poAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                    {discrepancy !== 0 && (
                      <div className="flex justify-between text-yellow-700">
                        <span className="font-medium">Difference:</span>
                        <span className="font-semibold">
                          {discrepancy > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(discrepancy))}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Line Items</h3>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Add any notes about this invoice..."
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div className="flex items-center space-x-3">
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                  >
                    Discard Changes
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reprocessMutation.mutate()}
                  disabled={reprocessMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reprocess
                </Button>
                {!isEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="brand-bg-500 hover:brand-bg-600"
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
