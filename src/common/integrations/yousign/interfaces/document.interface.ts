export enum DocumentNature {
  SIGNABLE_DOCUMENT = 'signable_document',
  SIGNABLE_DOCUMENT_INVISIBLE = 'signable_document_invisible',
  ATTACHMENT = 'attachment',
}

export interface UploadDocumentDto {
  file: Buffer;
  filename: string;
  nature: DocumentNature;
  parseAnchors?: boolean;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  nature: DocumentNature;
  contentType: string;
  createdAt: string;
  sha256: string;
  isProtected: boolean;
  isLocked: boolean;
}

export interface DownloadDocumentResponse {
  data: Buffer;
  filename: string;
  contentType: string;
}
