export enum MailStatus {
  SENT = 'sent',
  VIEWED = 'viewed',
  REFUSED = 'refused',
  NEGLIGENCE = 'negligence',
  PENDING = 'pending',
}

export enum RecipientType {
  PROFESSIONAL = 'professional',
  INDIVIDUAL = 'individual',
}

export interface CreateMailDto {
  idUser: string;
  recipient: {
    firstname: string;
    lastname: string;
    email: string;
    company?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    type: RecipientType;
  };
  subject?: string;
  message?: string;
  attachmentIds?: string[];
  eidas?: boolean;
  reference?: string;
  language?: string;
}

export interface MailResponse {
  id: string;
  idUser: string;
  status: MailStatus;
  reference?: string;
  createdAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  proofEvUrl?: string; // Proof of initial presentation
  proofArUrl?: string; // Proof of receipt (AR)
  proofNgUrl?: string; // Proof of negligence
  proofRfUrl?: string; // Proof of refusal
  recipient: {
    firstname: string;
    lastname: string;
    email: string;
    company?: string;
  };
  eidas: boolean;
}

export interface ListMailsDto {
  idUser: string;
  dateFrom?: Date;
  dateTo?: Date;
  reference?: string;
  page?: number;
  limit?: number;
}

export interface ListMailsResponse {
  data: MailResponse[];
  total: number;
  page: number;
  limit: number;
}
