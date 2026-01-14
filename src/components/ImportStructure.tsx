import { useState, useRef } from "react";
import { Upload, FileArchive, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportStructureProps {
  onImport: (filePaths: string[]) => void;
}

export const ImportStructure = ({ onImport }: ImportStructureProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [extractedPaths, setExtractedPaths] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast({
        title: "Invalid File",
        description: "Please select a .zip file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setIsOpen(true);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      const paths: string[] = [];
      
      contents.forEach((relativePath, zipEntry) => {
        // Only include files, not directories
        if (!zipEntry.dir) {
          paths.push(relativePath);
        }
      });

      setExtractedPaths(paths.sort());
      
      toast({
        title: "Archive Scanned",
        description: `Found ${paths.length} file paths`,
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to read the zip file",
        variant: "destructive",
      });
      setIsOpen(false);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = () => {
    onImport(extractedPaths);
    setIsOpen(false);
    setExtractedPaths([]);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setExtractedPaths([]);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
      >
        <Upload className="w-4 h-4 mr-2" />
        IMPORT STRUCTURE
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-foreground flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-primary" />
              EXTRACTED FILE PATHS
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {isProcessing ? (
              <div className="text-center py-8">
                <div className="text-primary animate-pulse font-display">
                  SCANNING ARCHIVE...
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Found <span className="text-primary font-bold">{extractedPaths.length}</span> files to import:
                </div>
                
                <div className="max-h-[300px] overflow-y-auto bg-secondary/50 rounded-sm border border-border p-4 space-y-1">
                  {extractedPaths.map((path, index) => (
                    <div
                      key={index}
                      className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-1 border-b border-border/30 last:border-0"
                    >
                      {path}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleConfirmImport}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    CONFIRM IMPORT
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-border hover:border-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    CANCEL
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
