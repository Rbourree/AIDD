export interface UploadAttachmentDto {
  idUser: string;
  file: Buffer;
  filename: string;
  mimeType?: string;
}

export interface AttachmentResponse {
  id: string;
  idUser: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  expiresAt: Date; // 30 days retention
}

export interface DownloadAttachmentResponse {
  data: Buffer;
  filename: string;
  contentType: string;
}
