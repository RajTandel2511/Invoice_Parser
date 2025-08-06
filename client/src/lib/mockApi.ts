import { nanoid } from 'nanoid';
import { type Invoice, type InsertInvoice } from '@shared/schema';

// Mock data storage
let mockInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    poNumber: "PO-2024-001",
    vendorName: "Tech Solutions Inc.",
    vendorId: "VND-001",
    invoiceDate: new Date("2024-01-15"),
    dueDate: new Date("2024-02-15"),
    subtotal: "2500.00",
    taxAmount: "250.00",
    totalAmount: "2750.00",
    poAmount: "2750.00",
    status: "matched",
    lineItems: [
      {
        description: "Web Development Services",
        quantity: 1,
        unitPrice: 2500,
        total: 2500
      }
    ],
    notes: "Monthly web development services",
    filename: "invoice-001.pdf",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    poNumber: "",
    vendorName: "Office Supplies Co.",
    vendorId: "VND-002",
    invoiceDate: new Date("2024-01-20"),
    dueDate: new Date("2024-02-20"),
    subtotal: "500.00",
    taxAmount: "50.00",
    totalAmount: "550.00",
    poAmount: "",
    status: "review_needed",
    lineItems: [
      {
        description: "Office Supplies",
        quantity: 10,
        unitPrice: 50,
        total: 500
      }
    ],
    notes: "Office supplies for Q1",
    filename: "invoice-002.pdf",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    poNumber: "PO-2024-003",
    vendorName: "Marketing Agency",
    vendorId: "VND-003",
    invoiceDate: new Date("2024-01-25"),
    dueDate: new Date("2024-02-25"),
    subtotal: "3000.00",
    taxAmount: "300.00",
    totalAmount: "3300.00",
    poAmount: "3300.00",
    status: "matched",
    lineItems: [
      {
        description: "Digital Marketing Campaign",
        quantity: 1,
        unitPrice: 3000,
        total: 3000
      }
    ],
    notes: "Q1 marketing campaign",
    filename: "invoice-003.pdf",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to save file to uploads folder
const saveFileToUploads = async (file: File): Promise<string> => {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const uniqueFilename = `${nameWithoutExt}_${timestamp}${extension}`;
    
    // Convert file to blob and create download link
    const blob = new Blob([file], { type: file.type });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = uniqueFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
    
    return uniqueFilename;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
};

export const mockApi = {
  // Get all invoices
  async getInvoices(): Promise<Invoice[]> {
    await delay(500); // Simulate network delay
    return [...mockInvoices];
  },

  // Get single invoice
  async getInvoice(id: string): Promise<Invoice | null> {
    await delay(300);
    return mockInvoices.find(invoice => invoice.id === id) || null;
  },

  // Upload and process invoice
  async uploadInvoice(file: File): Promise<{ success: boolean; message: string; invoiceId?: string }> {
    await delay(2000); // Simulate processing time
    
    try {
      // Save file to uploads folder
      const savedFilename = await saveFileToUploads(file);
      
      const mockInvoiceData: InsertInvoice = {
        invoiceNumber: `INV-${Date.now()}`,
        poNumber: "",
        vendorName: "Extracted Vendor Name",
        vendorId: `VND-${Math.floor(Math.random() * 10000)}`,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subtotal: "1000.00",
        taxAmount: "100.00",
        totalAmount: "1100.00",
        poAmount: "",
        status: "review_needed",
        lineItems: [
          {
            description: "Extracted Line Item",
            quantity: 1,
            unitPrice: 1000,
            total: 1000
          }
        ],
        notes: "Automatically processed from uploaded file",
        filename: savedFilename,
      };

      const newInvoice: Invoice = {
        ...mockInvoiceData,
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoices.push(newInvoice);

      return {
        success: true,
        message: `Invoice uploaded and processed successfully. File saved as: ${savedFilename}`,
        invoiceId: newInvoice.id
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  },

  // Update invoice
  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    await delay(500);
    
    const index = mockInvoices.findIndex(invoice => invoice.id === id);
    if (index === -1) {
      throw new Error("Invoice not found");
    }

    mockInvoices[index] = {
      ...mockInvoices[index],
      ...data,
      updatedAt: new Date(),
    };

    return mockInvoices[index];
  },

  // Match PO
  async matchPO(invoiceId: string, poNumber: string): Promise<{ success: boolean; message: string; invoice: Invoice }> {
    await delay(1000);
    
    const invoice = mockInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Simulate PO matching logic
    const mockPoAmount = Math.random() > 0.5 ? invoice.totalAmount : "1850.00";
    const status = mockPoAmount === invoice.totalAmount ? "matched" : "review_needed";

    const updatedInvoice = await this.updateInvoice(invoiceId, {
      poNumber,
      poAmount: mockPoAmount,
      status,
    });

    return {
      success: true,
      message: `PO matching completed - ${status}`,
      invoice: updatedInvoice
    };
  },

  // Reprocess invoice
  async reprocessInvoice(id: string): Promise<{ success: boolean; message: string }> {
    await delay(1500);
    
    const invoice = mockInvoices.find(inv => inv.id === id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Simulate reprocessing
    await this.updateInvoice(id, {
      status: "processing",
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Invoice reprocessing completed"
    };
  },

  // Delete invoice
  async deleteInvoice(id: string): Promise<boolean> {
    await delay(300);
    
    const index = mockInvoices.findIndex(invoice => invoice.id === id);
    if (index === -1) {
      return false;
    }

    mockInvoices.splice(index, 1);
    return true;
  }
}; 