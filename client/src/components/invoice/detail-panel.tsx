import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Edit, Save, RotateCcw, Trash2 } from "lucide-react";
import { mockApiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Invoice, insertInvoiceSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DetailPanelProps {
  invoice: Invoice;
  onInvoiceUpdate: () => void;
  onClose: () => void;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "matched":
      return {
        label: "Matched",
        color: "bg-green-100 text-green-800",
        icon: "✓",
      };
    case "review_needed":
      return {
        label: "Review Needed",
        color: "bg-yellow-100 text-yellow-800",
        icon: "⚠",
      };
    case "processing":
      return {
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
        icon: "⟳",
      };
    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-800",
        icon: "?",
      };
  }
};

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
      const response = await mockApiRequest.updateInvoice(invoice.id, data);
      return response;
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
      const response = await mockApiRequest.reprocessInvoice(invoice.id);
      return response;
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

  return (
    <div className="w-1/2 p-6 overflow-y-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Invoice Details
              <Badge className={statusInfo.color}>
                {statusInfo.icon} {statusInfo.label}
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    {...form.register("invoiceNumber")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    {...form.register("poNumber")}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input
                    id="vendorName"
                    {...form.register("vendorName")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="vendorId">Vendor ID</Label>
                  <Input
                    id="vendorId"
                    {...form.register("vendorId")}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    {...form.register("invoiceDate")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...form.register("dueDate")}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    {...form.register("subtotal")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="taxAmount">Tax Amount</Label>
                  <Input
                    id="taxAmount"
                    {...form.register("taxAmount")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    {...form.register("totalAmount")}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Invoice Number
                  </Label>
                  <p className="mt-1">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    PO Number
                  </Label>
                  <p className="mt-1">{invoice.poNumber || "Not assigned"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Vendor Name
                  </Label>
                  <p className="mt-1">{invoice.vendorName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Vendor ID
                  </Label>
                  <p className="mt-1">{invoice.vendorId || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Invoice Date
                  </Label>
                  <p className="mt-1">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </Label>
                  <p className="mt-1">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Subtotal
                  </Label>
                  <p className="mt-1 font-semibold">${invoice.subtotal}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tax Amount
                  </Label>
                  <p className="mt-1 font-semibold">${invoice.taxAmount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </Label>
                  <p className="mt-1 font-semibold text-lg">${invoice.totalAmount}</p>
                </div>
              </div>

              {invoice.poAmount && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    PO Amount
                  </Label>
                  <p className="mt-1 font-semibold">${invoice.poAmount}</p>
                </div>
              )}

              {/* Line Items */}
              {invoice.lineItems && invoice.lineItems.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Line Items
                  </Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice}</TableCell>
                          <TableCell>${item.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {invoice.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </Label>
                  <p className="mt-1 text-sm">{invoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => reprocessMutation.mutate()}
                  variant="outline"
                  disabled={reprocessMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {reprocessMutation.isPending ? "Processing..." : "Reprocess"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
