import { FileText, Upload, List, Link2, Settings, BarChart3 } from "lucide-react";

const navigationItems = [
  { icon: BarChart3, label: "Dashboard", href: "/", active: true },
  { icon: Upload, label: "Upload Invoice", href: "/upload", active: false },
  { icon: List, label: "Processed Invoices", href: "/invoices", active: false },
  { icon: Link2, label: "PO Matching", href: "/matching", active: false },
  { icon: Settings, label: "Settings", href: "/settings", active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-border flex flex-col shadow-sm">
      {/* Logo/Brand Section */}
      <div className="p-8 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">InvoiceFlow</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active
                    ? "bg-primary/5 text-primary font-medium border border-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${item.active ? 'text-primary' : ''}`} />
                <span className="text-sm">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/30">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-primary text-sm font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
