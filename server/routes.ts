import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, type InsertInvoice } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get single invoice
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Upload invoice file
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }

      // Simulate OCR processing and create invoice
      const mockInvoiceData: InsertInvoice = {
        invoiceNumber: `INV-${Date.now()}`,
        poNumber: `PO-${Date.now()}`,
        vendorName: "Extracted Vendor Name",
        vendorId: `VND-${Math.floor(Math.random() * 10000)}`,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subtotal: "1000.00",
        taxAmount: "100.00",
        totalAmount: "1100.00",
        poAmount: "1050.00",
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
        filename: req.file.originalname,
      };

      const invoice = await storage.createInvoice(mockInvoiceData);

      res.json({
        success: true,
        message: "Invoice uploaded and processed successfully",
        invoiceId: invoice.id
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process uploaded file" 
      });
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const updateSchema = insertInvoiceSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedInvoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Reprocess invoice
  app.post("/api/invoices/:id/reprocess", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Simulate reprocessing
      const updatedInvoice = await storage.updateInvoice(req.params.id, {
        status: "pending",
        notes: (invoice.notes || "") + "\nReprocessed on " + new Date().toISOString(),
      });

      // Simulate processing delay and update status
      setTimeout(async () => {
        await storage.updateInvoice(req.params.id, {
          status: "matched"
        });
      }, 2000);

      res.json({
        success: true,
        message: "Invoice reprocessing started",
        invoice: updatedInvoice
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reprocess invoice" });
    }
  });

  // PO matching endpoint
  app.post("/api/match", async (req, res) => {
    try {
      const { invoiceId, poNumber } = req.body;
      
      if (!invoiceId || !poNumber) {
        return res.status(400).json({ message: "Invoice ID and PO Number are required" });
      }

      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Simulate PO matching logic
      const mockPoAmount = Math.random() > 0.5 ? invoice.totalAmount : "1850.00";
      const status = mockPoAmount === invoice.totalAmount ? "matched" : "review_needed";

      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        poNumber,
        poAmount: mockPoAmount,
        status,
      });

      res.json({
        success: true,
        message: `PO matching completed - ${status}`,
        invoice: updatedInvoice
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to match PO" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvoice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
