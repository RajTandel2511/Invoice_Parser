import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Invoice } from "@shared/schema";
import { mockApiRequest } from "@/lib/queryClient";
import UploadPanel from "@/components/invoice/upload-panel";
import DetailPanel from "@/components/invoice/detail-panel";

export default function Dashboard() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>("inv-002");
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: mockApiRequest.getInvoices,
  });

  const { data: selectedInvoice } = useQuery<Invoice>({
    queryKey: ["invoice", selectedInvoiceId],
    queryFn: () => mockApiRequest.getInvoice(selectedInvoiceId!),
    enabled: !!selectedInvoiceId,
  });

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const handleInvoiceUpload = () => {
    // Refresh the invoices list after upload
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const handleInvoiceUpdate = () => {
    // Refresh both the list and the selected invoice
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    if (selectedInvoiceId) {
      queryClient.invalidateQueries({ queryKey: ["invoice", selectedInvoiceId] });
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <UploadPanel
        invoices={invoices}
        isLoading={isLoading}
        selectedInvoiceId={selectedInvoiceId}
        onInvoiceSelect={handleInvoiceSelect}
        onInvoiceUpload={handleInvoiceUpload}
      />
      
      {selectedInvoice && (
        <DetailPanel
          invoice={selectedInvoice}
          onInvoiceUpdate={handleInvoiceUpdate}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}
