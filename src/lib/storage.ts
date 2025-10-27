// Storage abstraction layer for easy migration between providers
// This interface ensures compatibility with Bunny Storage and future providers

// File upload metadata types
export type FileMetadata = {
  fileName?: string;
  contentType?: string;
  [key: string]: string | number | boolean | Date | undefined;
};

// Storage file with specific metadata structure
export interface StorageFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  metadata?: FileMetadata;
}

export interface UploadResult {
  success: boolean;
  file?: StorageFile;
  error?: string;
}

export interface StorageProvider {
  // Upload a file
  uploadFile(
    file: File,
    path: string,
    metadata?: FileMetadata
  ): Promise<UploadResult>;

  // Delete a file
  deleteFile(fileId: string): Promise<boolean>;

  // Get file URL
  getFileUrl(fileId: string): Promise<string>;

  // List files in a path
  listFiles(path: string): Promise<StorageFile[]>;

  // Get file metadata
  getFileMetadata(fileId: string): Promise<StorageFile | null>;
}

// Storage configuration interface
export interface StorageConfig {
  provider: "bunny-storage";
  bucket: string;
  region?: string;
  credentials: {
    apiKey?: string;
    region?: string;
    [key: string]: string | undefined;
  };
}

// Storage manager class that handles provider switching
export class StorageManager {
  private provider: StorageProvider;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: StorageConfig): StorageProvider {
    switch (config.provider) {
      case "bunny-storage":
        return new BunnyStorageProvider(
          config.credentials.apiKey || "",
          config.credentials.region || "ny",
          config.bucket
        );
      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  }

  // Public methods that delegate to the current provider
  async uploadFile(
    file: File,
    path: string,
    metadata?: FileMetadata
  ): Promise<UploadResult> {
    return this.provider.uploadFile(file, path, metadata);
  }

  async deleteFile(fileId: string): Promise<boolean> {
    return this.provider.deleteFile(fileId);
  }

  async getFileUrl(fileId: string): Promise<string> {
    return this.provider.getFileUrl(fileId);
  }

  async listFiles(path: string): Promise<StorageFile[]> {
    return this.provider.listFiles(path);
  }

  async getFileMetadata(fileId: string): Promise<StorageFile | null> {
    return this.provider.getFileMetadata(fileId);
  }

  // Method to switch providers (for migration)
  switchProvider(newConfig: StorageConfig): void {
    this.config = newConfig;
    this.provider = this.createProvider(newConfig);
  }
}

// Import the actual implementations
import { BunnyStorageProvider } from "./bunny-storage";

// Export the storage manager instance
export const storageManager = new StorageManager({
  provider: "bunny-storage", // Use Bunny Storage for best value
  bucket: process.env.BUNNY_STORAGE_BUCKET || "lms-multimedia",
  credentials: {
    apiKey: process.env.BUNNY_STORAGE_API_KEY || "",
    region: process.env.BUNNY_STORAGE_REGION || "ny",
  },
});
