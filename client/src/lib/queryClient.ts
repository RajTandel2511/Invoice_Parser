import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { mockApi } from "./mockApi";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Mock API functions for frontend-only development
export const mockApiRequest = {
  // Get all invoices
  async getInvoices() {
    return await mockApi.getInvoices();
  },

  // Get single invoice
  async getInvoice(id: string) {
    return await mockApi.getInvoice(id);
  },

  // Upload invoice
  async uploadInvoice(file: File) {
    return await mockApi.uploadInvoice(file);
  },

  // Update invoice
  async updateInvoice(id: string, data: any) {
    return await mockApi.updateInvoice(id, data);
  },

  // Match PO
  async matchPO(invoiceId: string, poNumber: string) {
    return await mockApi.matchPO(invoiceId, poNumber);
  },

  // Reprocess invoice
  async reprocessInvoice(id: string) {
    return await mockApi.reprocessInvoice(id);
  },

  // Delete invoice
  async deleteInvoice(id: string) {
    return await mockApi.deleteInvoice(id);
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
