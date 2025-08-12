import React from "react";
import EmailMonitorPanel from "@/components/invoice/email-monitor-panel";
import ExtractedInvoicesDisplay from "@/components/invoice/extracted-invoices-display";

export default function Invoices() {
  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          Invoice Automation
        </h1>
        <p className="text-muted-foreground mt-2">
          Automatically extract and display invoices from authorized team members
        </p>
      </div>
      
      {/* Email Monitor Panel */}
      <EmailMonitorPanel />
      
      {/* Extracted Invoices Display */}
      <ExtractedInvoicesDisplay />
    </div>
  );
}