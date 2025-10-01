export enum SignatureRequestDeliveryMode {
  EMAIL = 'email',
  NONE = 'none',
}

export enum SignatureRequestStatus {
  DRAFT = 'draft',
  ONGOING = 'ongoing',
  DONE = 'done',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
  DECLINED = 'declined',
}

export interface CreateSignatureRequestDto {
  name: string;
  deliveryMode?: SignatureRequestDeliveryMode;
  timezone?: string;
  expirationDate?: Date;
  reminderSettings?: {
    intervalInDays: number;
    maxOccurrences: number;
  };
}

export interface SignatureRequestResponse {
  id: string;
  status: SignatureRequestStatus;
  name: string;
  createdAt: string;
  deliveryMode: SignatureRequestDeliveryMode;
  timezone: string;
  expirationDate?: string;
  documents?: DocumentInRequest[];
  signers?: SignerInRequest[];
}

export interface DocumentInRequest {
  id: string;
  filename: string;
  nature: string;
  createdAt: string;
}

export interface SignerInRequest {
  id: string;
  status: string;
  info: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ListSignatureRequestsParams {
  status?: SignatureRequestStatus[];
  limit?: number;
  after?: string;
}

export interface SignatureRequestListResponse {
  data: SignatureRequestResponse[];
  hasMore: boolean;
  nextCursor?: string;
}
