import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Invoice } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import UploadPanel from "@/components/invoice/upload-panel";
import DetailPanel from "@/components/invoice/detail-panel";

export default function Dashboard() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>("inv-002");
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: selectedInvoice } = useQuery<Invoice>({
    queryKey: ["/api/invoices", selectedInvoiceId],
    enabled: !!selectedInvoiceId,
  });

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const handleInvoiceUpload = () => {
    // Refresh the invoices list after upload
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
  };

  const handleInvoiceUpdate = () => {
    // Refresh both the list and the selected invoice
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    if (selectedInvoiceId) {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", selectedInvoiceId] });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
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
      </main>
    </div>
  );
}
