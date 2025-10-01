export enum WebhookEventType {
  REGISTERED_LETTER = 'registered_letter',
  USER = 'user',
  NOTARY_CODE = 'notary_code',
}

export interface WebhookConfigDto {
  url: string;
  eventType: WebhookEventType;
  active?: boolean;
}

export interface WebhookResponse {
  id: string;
  url: string;
  eventType: WebhookEventType;
  active: boolean;
  createdAt: Date;
}

export interface WebhookPayload {
  eventType: WebhookEventType;
  mailId?: string;
  userId?: string;
  status?: string;
  timestamp: Date;
  data: Record<string, unknown>;
}
