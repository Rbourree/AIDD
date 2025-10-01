export enum SignatureLevel {
  ELECTRONIC_SIGNATURE = 'electronic_signature',
  ADVANCED_SIGNATURE = 'advanced_signature',
  QUALIFIED_SIGNATURE = 'qualified_signature',
}

export enum SignatureAuthenticationMode {
  NO_OTP = 'no_otp',
  OTP_SMS = 'otp_sms',
  OTP_EMAIL = 'otp_email',
}

export enum SignerStatus {
  INITIATED = 'initiated',
  NOTIFIED = 'notified',
  PROCESSING = 'processing',
  CONSENT_GIVEN = 'consent_given',
  SIGNED = 'signed',
  ABORTED = 'aborted',
  ERROR = 'error',
}

export enum SignatureFieldType {
  SIGNATURE = 'signature',
  TEXT = 'text',
  CHECKBOX = 'checkbox',
  RADIO_GROUP = 'radio_group',
  MENTION = 'mention',
}

export interface SignatureField {
  documentId: string;
  type: SignatureFieldType;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  mention?: string;
  mention2?: string;
  optional?: boolean;
}

export interface SignerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  locale?: string;
}

export interface AddSignerDto {
  info: SignerInfo;
  signatureLevel: SignatureLevel;
  signatureAuthenticationMode: SignatureAuthenticationMode;
  fields: SignatureField[];
  redirectUrls?: {
    success?: string;
    error?: string;
  };
}

export interface SignerResponse {
  id: string;
  status: SignerStatus;
  info: SignerInfo;
  signatureLevel: SignatureLevel;
  signatureAuthenticationMode: SignatureAuthenticationMode;
  signatureLink?: string;
  fields: SignatureField[];
  createdAt: string;
  updatedAt: string;
}
