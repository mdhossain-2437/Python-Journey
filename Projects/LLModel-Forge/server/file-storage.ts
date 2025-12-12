import { Client } from "minio";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import path from "path";

interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  size: number;
  contentType: string;
}

interface FileMetadata {
  originalName: string;
  uploadedBy: string;
  uploadedAt: string;
  modelId?: string;
  version?: string;
}

class FileStorageService {
  private client: Client | null = null;
  private isConfigured: boolean = false;
  private buckets = {
    models: process.env.MINIO_BUCKET_MODELS || "models",
    datasets: process.env.MINIO_BUCKET_DATASETS || "datasets",
    artifacts: process.env.MINIO_BUCKET_ARTIFACTS || "artifacts",
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const { MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL } = process.env;

    if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
      console.log("⚠️  File storage not configured (missing MinIO/S3 credentials)");
      return;
    }

    try {
      this.client = new Client({
        endPoint: MINIO_ENDPOINT,
        port: parseInt(MINIO_PORT || "9000"),
        useSSL: MINIO_USE_SSL === "true",
        accessKey: MINIO_ACCESS_KEY,
        secretKey: MINIO_SECRET_KEY,
      });

      // Create buckets if they don't exist
      await this.ensureBuckets();
      this.isConfigured = true;
      console.log("✅ File storage service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize file storage:", error);
    }
  }

  private async ensureBuckets() {
    if (!this.client) return;

    for (const bucket of Object.values(this.buckets)) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
        console.log(`Created bucket: ${bucket}`);
      }
    }
  }

  async uploadModel(
    file: Buffer | Readable,
    originalName: string,
    userId: string,
    modelId: string,
    version: string
  ): Promise<UploadResult | null> {
    if (!this.isConfigured || !this.client) {
      console.log("File storage not configured, skipping upload");
      return null;
    }

    const ext = path.extname(originalName);
    const key = `${modelId}/${version}/${randomUUID()}${ext}`;
    const bucket = this.buckets.models;

    const metadata: FileMetadata = {
      originalName,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      modelId,
      version,
    };

    const size = Buffer.isBuffer(file) ? file.length : 0;
    const contentType = this.getContentType(ext);

    await this.client.putObject(bucket, key, file, size || undefined, {
      "Content-Type": contentType,
      ...Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [`X-Amz-Meta-${k}`, String(v)])
      ),
    });

    return {
      key,
      bucket,
      url: await this.getPresignedUrl(bucket, key),
      size,
      contentType,
    };
  }

  async uploadDataset(
    file: Buffer | Readable,
    originalName: string,
    userId: string
  ): Promise<UploadResult | null> {
    if (!this.isConfigured || !this.client) return null;

    const ext = path.extname(originalName);
    const key = `${userId}/${Date.now()}-${randomUUID()}${ext}`;
    const bucket = this.buckets.datasets;

    const size = Buffer.isBuffer(file) ? file.length : 0;
    const contentType = this.getContentType(ext);

    await this.client.putObject(bucket, key, file, size || undefined, {
      "Content-Type": contentType,
    });

    return {
      key,
      bucket,
      url: await this.getPresignedUrl(bucket, key),
      size,
      contentType,
    };
  }

  async uploadArtifact(
    file: Buffer | Readable,
    originalName: string,
    experimentId: string
  ): Promise<UploadResult | null> {
    if (!this.isConfigured || !this.client) return null;

    const ext = path.extname(originalName);
    const key = `${experimentId}/${Date.now()}-${originalName}`;
    const bucket = this.buckets.artifacts;

    const size = Buffer.isBuffer(file) ? file.length : 0;
    const contentType = this.getContentType(ext);

    await this.client.putObject(bucket, key, file, size || undefined, {
      "Content-Type": contentType,
    });

    return {
      key,
      bucket,
      url: await this.getPresignedUrl(bucket, key),
      size,
      contentType,
    };
  }

  async getPresignedUrl(bucket: string, key: string, expirySeconds: number = 3600): Promise<string> {
    if (!this.isConfigured || !this.client) {
      return "";
    }

    return this.client.presignedGetObject(bucket, key, expirySeconds);
  }

  async downloadFile(bucket: string, key: string): Promise<Readable | null> {
    if (!this.isConfigured || !this.client) return null;

    return this.client.getObject(bucket, key);
  }

  async deleteFile(bucket: string, key: string): Promise<boolean> {
    if (!this.isConfigured || !this.client) return false;

    try {
      await this.client.removeObject(bucket, key);
      return true;
    } catch (error) {
      console.error("Failed to delete file:", error);
      return false;
    }
  }

  async listModelFiles(modelId: string): Promise<string[]> {
    if (!this.isConfigured || !this.client) return [];

    const objects: string[] = [];
    const stream = this.client.listObjects(this.buckets.models, modelId, true);

    return new Promise((resolve, reject) => {
      stream.on("data", (obj) => {
        if (obj.name) objects.push(obj.name);
      });
      stream.on("error", reject);
      stream.on("end", () => resolve(objects));
    });
  }

  async getFileStats(bucket: string, key: string): Promise<any | null> {
    if (!this.isConfigured || !this.client) return null;

    try {
      return await this.client.statObject(bucket, key);
    } catch {
      return null;
    }
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      ".pkl": "application/octet-stream",
      ".joblib": "application/octet-stream",
      ".pt": "application/octet-stream",
      ".pth": "application/octet-stream",
      ".h5": "application/x-hdf5",
      ".onnx": "application/octet-stream",
      ".pb": "application/octet-stream",
      ".json": "application/json",
      ".yaml": "text/yaml",
      ".yml": "text/yaml",
      ".csv": "text/csv",
      ".parquet": "application/octet-stream",
      ".zip": "application/zip",
      ".tar": "application/x-tar",
      ".gz": "application/gzip",
    };
    return types[ext.toLowerCase()] || "application/octet-stream";
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

export const fileStorage = new FileStorageService();

