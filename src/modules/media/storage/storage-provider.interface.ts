export interface UploadedFileResult {
  url: string;
  key: string;
}

/**
 * Every storage backend (local disk, S3-compatible bucket) implements this.
 * Swapping `STORAGE_PROVIDER` in `.env` is the only change needed to switch
 * — no application code elsewhere references a specific provider.
 */
export interface StorageProvider {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileResult>;
}
