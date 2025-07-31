import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, FileText, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onSuccess: (data, file) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      setUploadedFiles(prev => [...prev, file.name]);
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
      acceptedFiles.forEach(file => {
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          Upload Invoices
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload your invoice files for automated processing and PO matching
        </p>
      </div>

      {/* Main Upload Card */}
      <Card className="mb-8 shadow-sm border-border">
        <CardContent className="p-12">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto w-20 h-20 bg-muted rounded-xl flex items-center justify-center mb-8">
              <CloudUpload className={`h-10 w-10 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              {isDragActive
                ? "Drop the files here..."
                : "Drag and drop your invoice files here"}
            </h3>
            {!isDragActive && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-lg">or</p>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Browse Files
                </Button>
              </div>
            )}
            <p className="text-muted-foreground mt-6">
              Supports PDF, PNG, JPG • Maximum 10MB per file • Multiple files allowed
            </p>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="shadow-sm border-border">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Recently Uploaded Files
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((filename, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{filename}</p>
                    <p className="text-sm text-muted-foreground">Processing completed</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}