import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
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

      const response = await api.uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);

      return response;
    },
    onSuccess: (data, file) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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
      // Upload each file sequentially
      acceptedFiles.forEach((file) => {
        uploadMutation.mutate(file);
      });
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
    multiple: true,
  });

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Invoice Dashboard</h1>
          <p className="text-muted-foreground">
            Upload and manage your invoices with automated processing and PO matching.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Upload Section */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? "Drop files here" : "Upload Invoices"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, PNG, JPG (max 10MB per file)
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop files here, or click to select files
                </p>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Status */}
          {uploadMutation.isPending && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Uploading files...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}