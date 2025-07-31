import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { CloudUpload } from "lucide-react";
import { type Invoice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InvoiceListItem from "./invoice-list-item";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UploadPanelProps {
  invoices: Invoice[];
  isLoading: boolean;
  selectedInvoiceId: string | null;
  onInvoiceSelect: (invoiceId: string) => void;
  onInvoiceUpload: () => void;
}

export default function UploadPanel({
  invoices,
  isLoading,
  selectedInvoiceId,
  onInvoiceSelect,
  onInvoiceUpload,
}: UploadPanelProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiRequest("POST", "/api/upload", formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      onInvoiceUpload();
    },
    onError: (error) => {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div className="w-1/2 p-8 overflow-y-auto">
      {/* Upload Section */}
      <Card className="mb-8 shadow-sm border-border">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Upload Invoice</h2>

          {/* Drag and Drop Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
              <CloudUpload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-foreground mb-2 text-lg font-medium">
              {isDragActive
                ? "Drop the file here..."
                : "Drag and drop your invoice files here"}
            </p>
            {!isDragActive && (
              <div className="space-y-2">
                <p className="text-muted-foreground">or</p>
                <button className="text-primary font-medium hover:text-primary/80 transition-colors">
                  browse files
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Supports PDF, PNG, JPG (max 10MB)
            </p>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mt-6">
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-3">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Recent Invoices</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <InvoiceListItem
                  key={invoice.id}
                  invoice={invoice}
                  isSelected={invoice.id === selectedInvoiceId}
                  onSelect={() => onInvoiceSelect(invoice.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
