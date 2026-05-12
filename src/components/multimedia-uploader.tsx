"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  X,
  FileImage,
  Video,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Supported multimedia formats
const SUPPORTED_FORMATS = {
  images: {
    types: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    maxSize: 10 * 1024 * 1024, // 10MB
    label: "Images",
  },
  videos: {
    types: [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/wmv",
    ],
    extensions: [".mp4", ".webm", ".ogg", ".avi", ".mov", ".wmv"],
    maxSize: 100 * 1024 * 1024, // 100MB
    label: "Videos",
  },
  interactive: {
    types: ["application/json", "text/html", "application/xhtml+xml"],
    extensions: [".json", ".html", ".htm", ".xhtml"],
    maxSize: 5 * 1024 * 1024, // 5MB
    label: "Interactive Content",
  },
};

type MultimediaFile = {
  id: string;
  file: File;
  type: "image" | "video" | "interactive";
  url: string;
  name: string;
  size: number;
};

type UploadedFile = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  metadata?: Record<string, unknown>;
};

type MultimediaUploaderProps = {
  onFilesChange?: (files: MultimediaFile[]) => void;
  onUploadComplete?: (uploadedFiles: UploadedFile[]) => void;
  maxFiles?: number;
  allowedTypes?: ("images" | "videos" | "interactive")[];
  className?: string;
  disabled?: boolean;
  lessonId?: string; // For uploading to specific lesson
};

export function MultimediaUploader({
  onFilesChange,
  onUploadComplete,
  maxFiles = 10,
  allowedTypes = ["images", "videos", "interactive"],
  className = "",
  disabled = false,
  lessonId,
}: MultimediaUploaderProps) {
  const [files, setFiles] = useState<MultimediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file format and size
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const fileSize = file.size;

    // Check if file type is allowed
    for (const category of allowedTypes) {
      const format = SUPPORTED_FORMATS[category];

      // Check MIME type
      if (format.types.includes(fileType)) {
        // Check file size
        if (fileSize > format.maxSize) {
          return {
            valid: false,
            error: `${format.label} files must be smaller than ${format.maxSize / (1024 * 1024)}MB. Your file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB.`,
          };
        }
        return { valid: true };
      }

      // Check file extension as fallback
      const hasValidExtension = format.extensions.some((ext) =>
        fileName.endsWith(ext),
      );
      if (hasValidExtension) {
        if (fileSize > format.maxSize) {
          return {
            valid: false,
            error: `${format.label} files must be smaller than ${format.maxSize / (1024 * 1024)}MB. Your file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB.`,
          };
        }
        return { valid: true };
      }
    }

    // If no valid format found
    const allowedFormats = allowedTypes
      .map((type) => SUPPORTED_FORMATS[type].extensions)
      .flat();
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: ${allowedFormats.join(", ")}`,
    };
  };

  // Determine file category
  const getFileCategory = (file: File): "image" | "video" | "interactive" => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (
      SUPPORTED_FORMATS.images.types.includes(fileType) ||
      SUPPORTED_FORMATS.images.extensions.some((ext) => fileName.endsWith(ext))
    ) {
      return "image";
    }

    if (
      SUPPORTED_FORMATS.videos.types.includes(fileType) ||
      SUPPORTED_FORMATS.videos.extensions.some((ext) => fileName.endsWith(ext))
    ) {
      return "video";
    }

    return "interactive";
  };

  // Handle file processing
  const processFiles = useCallback(
    async (newFiles: File[]) => {
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: MultimediaFile[] = [];
      const errors: string[] = [];

      // Validate files first
      newFiles.forEach((file) => {
        const validation = validateFile(file);

        if (validation.valid) {
          const category = getFileCategory(file);
          const multimediaFile: MultimediaFile = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            type: category,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
          };
          validFiles.push(multimediaFile);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (errors.length > 0) {
        toast.error(`Upload failed:\n${errors.join("\n")}`);
      }

      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);
        toast.success(`${validFiles.length} file(s) added successfully`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, maxFiles, allowedTypes, onFilesChange],
  );

  // Handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  // Upload files to server
  const uploadFiles = async () => {
    if (!lessonId || files.length === 0) {
      toast.error("No files to upload or lesson ID missing");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file.file);
      });

      const response = await fetch(`/api/lessons/${lessonId}/multimedia`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Upload error response:", errorData);
        toast.error(
          errorData.details ||
            errorData.error ||
            `Upload failed: ${response.status}`,
        );
        return;
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        onUploadComplete?.(result.uploadedFiles);
        // Clear local files after successful upload
        setFiles([]);
        onFilesChange?.([]);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (error) {
      toast.error(
        "Upload failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "interactive":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get accepted file types for input
  const getAcceptedTypes = () => {
    return allowedTypes
      .map((type) => SUPPORTED_FORMATS[type].types)
      .flat()
      .join(",");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="text-muted-foreground mb-2 h-8 w-8" />
          <p className="text-muted-foreground mb-1 text-sm font-medium">
            {disabled ? "Upload disabled" : "Click to upload or drag and drop"}
          </p>
          <p className="text-muted-foreground text-center text-xs">
            {allowedTypes
              .map((type) => SUPPORTED_FORMATS[type].label)
              .join(", ")}{" "}
            files
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Max {maxFiles} files
          </p>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAcceptedTypes()}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Files Ready for Upload ({files.length})
            </h4>
            {lessonId && (
              <Button
                onClick={uploadFiles}
                disabled={disabled || isUploading}
                size="sm"
                className="h-8"
              >
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {file.type} • {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={disabled || isUploading}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Format Information */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div className="text-muted-foreground text-xs">
              <p className="mb-1 font-medium">Supported Formats:</p>
              {allowedTypes.map((type) => {
                const format = SUPPORTED_FORMATS[type];
                return (
                  <p key={type} className="mb-1">
                    <strong>{format.label}:</strong>{" "}
                    {format.extensions.join(", ")}
                    (max {format.maxSize / (1024 * 1024)}MB)
                  </p>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
