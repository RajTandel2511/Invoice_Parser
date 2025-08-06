import { z } from "zod";

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  poNumber: z.string().optional(),
  vendorName: z.string(),
  vendorId: z.string().optional(),
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  subtotal: z.string(),
  taxAmount: z.string(),
  totalAmount: z.string(),
  poAmount: z.string().optional(),
  status: z.enum(["pending", "matched", "review_needed", "not_matched", "processing"]).default("pending"),
  lineItems: z.array(lineItemSchema).default([]),
  notes: z.string().optional(),
  filename: z.string().optional(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export const invoiceSchema = insertInvoiceSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const uploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  invoiceId: z.string().optional(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
});

export const insertUserSchema = userSchema.pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;
