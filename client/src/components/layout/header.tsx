import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Invoice Processing Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and process invoices with automated PO matching
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="brand-bg-500 text-white hover:brand-bg-600">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>
    </header>
  );
}
