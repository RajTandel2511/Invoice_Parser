import { FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface UploadedFile {
  filename: string;
  size: number;
  uploadedAt: string;
  path: string;
}

interface UploadedFilesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedFiles: UploadedFile[];
  onFileDeleted: () => void;
}

export default function UploadedFilesDialog({
  isOpen,
  onClose,
  uploadedFiles,
  onFileDeleted,
}: UploadedFilesDialogProps) {
  const { toast } = useToast();

  const handleDeleteFile = async (filename: string) => {
    try {
      const result = await api.deleteFile(filename);
      
      if (result.success) {
        toast({
          title: "File Deleted",
          description: `${filename} has been deleted successfully.`,
        });
        onFileDeleted(); // Refresh the file list
      } else {
        toast({
          title: "Delete Failed",
          description: result.message || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the file",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Files ({uploadedFiles.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shadow-sm">
                      {file.filename.endsWith('.pdf') ? 'PDF' : 'Image'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.filename)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
