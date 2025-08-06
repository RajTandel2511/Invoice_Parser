import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Header() {
  return (
    <header className="bg-background border-b border-border px-8 py-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Invoice Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage invoices with automated processing
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm px-6">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>
    </header>
  );
}
