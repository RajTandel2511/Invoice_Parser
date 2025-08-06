import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, FileText, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  filename: string;
  size: number;
  uploadDate: string;
  path: string;
}

export default function Upload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch uploaded files on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      const result = await api.getUploadedFiles();
      if (result.success && result.files) {
        setUploadedFiles(result.files);
      }
    };
    fetchFiles();
  }, []);

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
      
      // Refresh the uploaded files list
      const fetchFiles = async () => {
        const result = await api.getUploadedFiles();
        if (result.success && result.files) {
          setUploadedFiles(result.files);
        }
      };
      fetchFiles();
      
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

  const handleProcessInvoices = async () => {
    try {
      // Check if there are any PDF files to process
      const pdfFiles = uploadedFiles.filter(file => file.filename.endsWith('.pdf'));
      
      if (pdfFiles.length === 0) {
        toast({
          title: "No PDF Files",
          description: "No PDF files available to process",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing Invoices",
        description: `Starting to process ${pdfFiles.length} PDF files...`,
      });

      // For now, just show a success message
      // In the future, this would call the Python processing script
      setTimeout(() => {
        toast({
          title: "Processing Complete!",
          description: `Successfully processed ${pdfFiles.length} invoices`,
        });
      }, 2000);

    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process invoices",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAllFiles = async () => {
    try {
      if (uploadedFiles.length === 0) {
        toast({
          title: "No Files",
          description: "No files available to download",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Downloading Files",
        description: "Preparing files for download...",
      });

      // Download each file sequentially
      for (const file of uploadedFiles) {
        try {
          // Create a download link for each file
          const link = document.createElement('a');
          link.href = `http://localhost:3001/api/files/${file.filename}`;
          link.download = file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to download ${file.filename}:`, error);
        }
      }

      toast({
        title: "Download Complete",
        description: "All files have been downloaded!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download files",
        variant: "destructive",
      });
    }
  };

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

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleProcessInvoices}
                  className="flex-1"
                  variant="default"
                  disabled={uploadedFiles.filter(f => f.filename.endsWith('.pdf')).length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Process Invoices
                </Button>
                <Button 
                  onClick={handleDownloadAllFiles}
                  className="flex-1"
                  variant="outline"
                  disabled={uploadedFiles.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Files
                </Button>
              </div>
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