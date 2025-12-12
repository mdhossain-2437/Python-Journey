import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuthFetch } from "@/hooks/use-auth";
import {
  Upload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  modelId: string;
  version?: string;
  onUploadComplete?: (result: any) => void;
}

const allowedExtensions = [
  ".pkl", ".joblib", ".pt", ".pth", ".h5", ".onnx", ".pb",
  ".json", ".yaml", ".yml", ".zip", ".tar", ".gz"
];

export function ModelFileUpload({ modelId, version, onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const authFetch = useAuthFetch();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate extension
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(", ")}`);
      return;
    }

    // Validate size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 500MB limit");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.slice(droppedFile.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setError(`Invalid file type. Allowed: ${allowedExtensions.join(", ")}`);
        return;
      }
      setFile(droppedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (version) {
        formData.append("version", version);
      }

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/models/${modelId}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const result = await response.json();
      setProgress(100);
      setSuccess(true);
      toast({ title: "Success", description: "Model file uploaded successfully!" });
      onUploadComplete?.(result);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Upload Model File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            "hover:border-primary/50 hover:bg-primary/5",
            error && "border-destructive bg-destructive/5",
            success && "border-green-500 bg-green-500/5"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedExtensions.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />

          {success ? (
            <div className="space-y-2">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-500 font-medium">Upload Complete!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Drag and drop your model file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: {allowedExtensions.join(", ")} (max 500MB)
              </p>
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {file && !success && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-1 hover:bg-muted rounded"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Uploading... {progress}%
            </p>
          </div>
        )}

        {/* Upload Button */}
        {file && !success && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Model
              </>
            )}
          </button>
        )}

        {/* Upload Another */}
        {success && (
          <button
            onClick={clearFile}
            className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-md font-medium transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Another File
          </button>
        )}
      </CardContent>
    </Card>
  );
}

