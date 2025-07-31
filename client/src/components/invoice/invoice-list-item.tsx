import { FileText, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { type Invoice } from "@shared/schema";
import { formatCurrency } from "@/lib/types";

interface InvoiceListItemProps {
  invoice: Invoice;
  isSelected: boolean;
  onSelect: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'matched':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'review_needed':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case 'not_matched':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'matched':
      return 'Matched';
    case 'review_needed':
      return 'Review Needed';
    case 'not_matched':
      return 'Not Matched';
    case 'pending':
      return 'Processing';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'matched':
      return 'bg-green-100 text-green-800';
    case 'review_needed':
      return 'bg-yellow-100 text-yellow-800';
    case 'not_matched':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function InvoiceListItem({
  invoice,
  isSelected,
  onSelect,
}: InvoiceListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-5 border rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-200 ${
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            invoice.status === "matched"
              ? "bg-green-100"
              : invoice.status === "review_needed"
              ? "bg-yellow-100"
              : invoice.status === "not_matched"
              ? "bg-red-100"
              : "bg-muted"
          }`}
        >
          <FileText
            className={`h-6 w-6 ${
              invoice.status === "matched"
                ? "text-green-600"
                : invoice.status === "review_needed"
                ? "text-yellow-600"
                : invoice.status === "not_matched"
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{invoice.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">{invoice.vendorName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground text-sm">
          {formatCurrency(invoice.totalAmount)}
        </p>
        <div className="flex items-center justify-end space-x-2 mt-1">
          {getStatusIcon(invoice.status)}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
          >
            {getStatusLabel(invoice.status)}
          </span>
        </div>
      </div>
    </div>
  );
}