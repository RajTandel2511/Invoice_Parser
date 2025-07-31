import { type User, type InsertUser, type Invoice, type InsertInvoice, type LineItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getAllInvoices(): Promise<Invoice[]>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private invoices: Map<string, Invoice>;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    
    // Initialize with some sample invoices
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleInvoices: Invoice[] = [
      {
        id: "inv-001",
        invoiceNumber: "INV-2024-001",
        poNumber: "PO-2024-0844",
        vendorName: "Acme Corp",
        vendorId: "VND-1001",
        invoiceDate: new Date("2024-01-10"),
        dueDate: new Date("2024-02-09"),
        subtotal: "2200.00",
        taxAmount: "250.00",
        totalAmount: "2450.00",
        poAmount: "2450.00",
        status: "matched",
        lineItems: [
          { description: "Office Supplies", quantity: 5, unitPrice: 440, total: 2200 }
        ],
        notes: "Standard office supply order",
        filename: "acme_invoice_001.pdf",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        id: "inv-002",
        invoiceNumber: "INV-2024-002",
        poNumber: "PO-2024-0845",
        vendorName: "TechStart Solutions",
        vendorId: "VND-2089",
        invoiceDate: new Date("2024-01-15"),
        dueDate: new Date("2024-02-14"),
        subtotal: "1590.00",
        taxAmount: "300.00",
        totalAmount: "1890.00",
        poAmount: "1850.00",
        status: "review_needed",
        lineItems: [
          { description: "Software License - Premium", quantity: 2, unitPrice: 750, total: 1500 },
          { description: "Setup & Configuration", quantity: 1, unitPrice: 90, total: 90 }
        ],
        notes: "Amount discrepancy needs approval from Finance team. Possible additional service charge not covered in original PO.",
        filename: "techstart_invoice_002.pdf",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "inv-003",
        invoiceNumber: "INV-2024-003",
        poNumber: "PO-2024-0846",
        vendorName: "Global Supplies Ltd",
        vendorId: "VND-3012",
        invoiceDate: new Date("2024-01-20"),
        dueDate: new Date("2024-02-19"),
        subtotal: "2900.00",
        taxAmount: "300.00",
        totalAmount: "3200.00",
        poAmount: null,
        status: "not_matched",
        lineItems: [
          { description: "Industrial Equipment", quantity: 1, unitPrice: 2900, total: 2900 }
        ],
        notes: "No matching PO found in system",
        filename: "global_invoice_003.pdf",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      }
    ];

    sampleInvoices.forEach(invoice => {
      this.invoices.set(invoice.id, invoice);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const now = new Date();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      status: insertInvoice.status || "pending",
      poNumber: insertInvoice.poNumber || null,
      vendorId: insertInvoice.vendorId || null,
      dueDate: insertInvoice.dueDate || null,
      poAmount: insertInvoice.poAmount || null,
      notes: insertInvoice.notes || null,
      filename: insertInvoice.filename || null,
      lineItems: insertInvoice.lineItems || [],
      createdAt: now,
      updatedAt: now,
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) {
      return undefined;
    }

    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...updates,
      id,
      updatedAt: new Date(),
      lineItems: updates.lineItems || existingInvoice.lineItems,
    };

    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.invoices.delete(id);
  }
}

export const storage = new MemStorage();
