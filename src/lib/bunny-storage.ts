// Bunny Storage implementation using their native API
import {
  StorageProvider,
  StorageFile,
  UploadResult,
  FileMetadata,
} from "./storage";

export class BunnyStorageProvider implements StorageProvider {
  private apiKey: string;
  private region: string;
  private bucket: string;
  private baseUrl: string;

  constructor(apiKey: string, region: string, bucket: string) {
    this.apiKey = apiKey;
    this.region = region.toLowerCase(); // Normalize region to lowercase
    this.bucket = bucket;
    // Use global storage endpoint without region
    this.baseUrl = `https://storage.bunnycdn.com/${bucket}`;
  }

  async uploadFile(
    file: File | Blob | Buffer,
    path: string,
    metadata?: FileMetadata
  ): Promise<UploadResult> {
    try {
      // Get file name and type - handle both File and generic types
      const fileName =
        file instanceof File ? file.name : metadata?.fileName || "file";
      const fileType =
        file instanceof File
          ? file.type
          : metadata?.contentType || "application/octet-stream";
      const fileSize =
        file instanceof File
          ? file.size
          : file instanceof Buffer
            ? file.length
            : 0;

      // Create the full path for Bunny Storage
      const fullPath = `${path}/${fileName}`;
      const uploadUrl = `${this.baseUrl}/${fullPath}`;

      console.log("Uploading to Bunny Storage:", uploadUrl);

      // Convert file to ArrayBuffer for upload
      let fileBuffer: ArrayBuffer | ArrayBufferLike;
      if (file instanceof File || file instanceof Blob) {
        fileBuffer = await file.arrayBuffer();
      } else if (file instanceof Buffer) {
        fileBuffer = file.buffer;
      } else {
        throw new Error("Unsupported file type");
      }

      // Upload file using Bunny Storage API
      // Use application/octet-stream for binary files as recommended by Bunny
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          AccessKey: this.apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer as BodyInit,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Bunny Storage upload failed:",
          response.status,
          errorText
        );
        console.error("Request details:", {
          uploadUrl,
          headers: {
            AccessKey: this.apiKey
              ? `${this.apiKey.substring(0, 5)}...`
              : "MISSING",
          },
        });
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Generate public URL using CDN Pull Zone
      const publicUrl = `https://fox-lms-pull-zone.b-cdn.net/${fullPath}`;

      console.log("Bunny Storage upload successful:", publicUrl);

      // Create StorageFile object
      const storageFile: StorageFile = {
        id: fullPath,
        name: fileName,
        url: publicUrl,
        size: fileSize,
        type: fileType,
        uploadedAt: new Date(),
        metadata: {
          ...metadata,
          fullPath: fullPath,
          bucket: this.bucket,
          region: this.region,
        },
      };

      return {
        success: true,
        file: storageFile,
      };
    } catch (error) {
      console.error("Bunny Storage upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // fileId is the full path like "lessons/{lessonId}/multimedia/{filename}"
      const deleteUrl = `${this.baseUrl}/${fileId}`;

      console.log("Deleting file from Bunny Storage:", deleteUrl);

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          AccessKey: this.apiKey,
        },
      });

      const success = response.ok;
      console.log(
        success ? "✓ File deleted" : `✗ Delete failed: ${response.status}`
      );

      return success;
    } catch (error) {
      console.error("Bunny Storage delete error:", error);
      return false;
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    // Use CDN Pull Zone URL
    return `https://fox-lms-pull-zone.b-cdn.net/${fileId}`;
  }

  async listFiles(path: string): Promise<StorageFile[]> {
    try {
      const listUrl = `${this.baseUrl}/${path}`;

      const response = await fetch(listUrl, {
        method: "GET",
        headers: {
          AccessKey: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`List files failed: ${response.status}`);
      }

      interface BunnyFile {
        ObjectName: string;
        Length: number;
        ContentType: string;
        LastChanged: string;
      }

      const files = (await response.json()) as BunnyFile[];

      // Convert Bunny Storage response to our StorageFile format
      return files.map(file => ({
        id: file.ObjectName,
        name: file.ObjectName.split("/").pop() || file.ObjectName,
        url: `https://${this.bucket}.b-cdn.net/${file.ObjectName}`,
        size: file.Length,
        type: file.ContentType || "unknown",
        uploadedAt: new Date(file.LastChanged),
        metadata: {
          fullPath: file.ObjectName,
          bucket: this.bucket,
          region: this.region,
        },
      }));
    } catch (error) {
      console.error("Bunny Storage list files error:", error);
      return [];
    }
  }

  async getFileMetadata(fileId: string): Promise<StorageFile | null> {
    try {
      // Get file info from Bunny Storage
      const infoUrl = `${this.baseUrl}/${fileId}`;

      const response = await fetch(infoUrl, {
        method: "HEAD",
        headers: {
          AccessKey: this.apiKey,
        },
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("Content-Type") || "unknown";
      const contentLength = response.headers.get("Content-Length");
      const lastModified = response.headers.get("Last-Modified");

      return {
        id: fileId,
        name: fileId.split("/").pop() || fileId,
        url: `https://${this.bucket}.b-cdn.net/${fileId}`,
        size: contentLength ? parseInt(contentLength) : 0,
        type: contentType,
        uploadedAt: lastModified ? new Date(lastModified) : new Date(),
        metadata: {
          fullPath: fileId,
          bucket: this.bucket,
          region: this.region,
        },
      };
    } catch (error) {
      console.error("Bunny Storage get metadata error:", error);
      return null;
    }
  }
}

// Helper function to create Bunny Storage provider
export function createBunnyStorageProvider(
  apiKey: string,
  region: string,
  bucket: string
): BunnyStorageProvider {
  return new BunnyStorageProvider(apiKey, region, bucket);
}
