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
      className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? "border-l-4 brand-border-500 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            invoice.status === "matched"
              ? "bg-green-100"
              : invoice.status === "review_needed"
              ? "bg-yellow-100"
              : invoice.status === "not_matched"
              ? "bg-red-100"
              : "bg-gray-100"
          }`}
        >
          <FileText
            className={`h-5 w-5 ${
              invoice.status === "matched"
                ? "text-green-600"
                : invoice.status === "review_needed"
                ? "text-yellow-600"
                : invoice.status === "not_matched"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          />
        </div>
        <div>
          <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-500">{invoice.vendorName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">
          {formatCurrency(invoice.totalAmount)}
        </p>
        <div className="flex items-center space-x-1">
          {getStatusIcon(invoice.status)}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
          >
            {getStatusLabel(invoice.status)}
          </span>
        </div>
      </div>
    </div>
  );
}