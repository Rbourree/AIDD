import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import * as FormData from 'form-data';
import {
  CreateMailDto,
  MailResponse,
  ListMailsDto,
  ListMailsResponse,
  MailStatus,
} from './interfaces/mail.interface';
import {
  UploadAttachmentDto,
  AttachmentResponse,
  DownloadAttachmentResponse,
} from './interfaces/attachment.interface';
import {
  WebhookConfigDto,
  WebhookResponse,
} from './interfaces/webhook.interface';
import {
  Ar24ConfigurationException,
  Ar24AuthenticationException,
  Ar24MailSendException,
  Ar24MailNotFoundException,
  Ar24AttachmentUploadException,
  Ar24AttachmentSizeException,
  Ar24ProofNotFoundException,
  Ar24WebhookException,
  Ar24RateLimitException,
  Ar24ApiException,
} from './exceptions/ar24.exceptions';

@Injectable()
export class Ar24Service {
  private readonly logger = new Logger(Ar24Service.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly privateKey: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('ar24.token');
    this.privateKey = this.configService.get<string>('ar24.privateKey');
    const environment = this.configService.get<string>('ar24.environment') || 'sandbox';

    if (!this.token || !this.privateKey) {
      throw new Ar24ConfigurationException('AR24 token and private key must be configured');
    }

    this.baseUrl = environment === 'production'
      ? 'https://ar24.fr/api'
      : 'https://sandbox.ar24.fr/api';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'fr-FR',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for authentication and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor to add authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const date = new Date().toISOString();
        const signature = this.generateSignature(date);

        config.params = {
          ...config.params,
          token: this.token,
          date,
          signature,
        };

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          const message = data?.message || data?.error || 'Unknown error';

          this.logger.error(`AR24 API error (${status}): ${message}`);

          if (status === 401 || status === 403) {
            throw new Ar24AuthenticationException(message);
          } else if (status === 429) {
            throw new Ar24RateLimitException();
          } else {
            throw new Ar24ApiException(status, message);
          }
        }
        throw error;
      },
    );
  }

  /**
   * Generate signature for AR24 API authentication
   */
  private generateSignature(date: string): string {
    const data = `${date}${this.privateKey}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Send a registered mail via AR24
   */
  async sendMail(dto: CreateMailDto): Promise<MailResponse> {
    try {
      const payload = {
        id_user: dto.idUser,
        to_firstname: dto.recipient.firstname,
        to_lastname: dto.recipient.lastname,
        to_email: dto.recipient.email,
        to_company: dto.recipient.company,
        to_address: dto.recipient.address,
        to_postal_code: dto.recipient.postalCode,
        to_city: dto.recipient.city,
        to_country: dto.recipient.country || 'FR',
        dest_statut: dto.recipient.type,
        subject: dto.subject,
        content: dto.message,
        eidas: dto.eidas ? 1 : 0,
        ref_dossier: dto.reference,
        attachment_ids: dto.attachmentIds,
      };

      const response = await this.axiosInstance.post('/mail', payload);

      this.logger.log(`Registered mail sent successfully: ${response.data.id}`);

      return this.mapMailResponse(response.data);
    } catch (error) {
      if (error instanceof Ar24AuthenticationException ||
          error instanceof Ar24RateLimitException ||
          error instanceof Ar24ApiException) {
        throw error;
      }
      throw new Ar24MailSendException(error.message);
    }
  }

  /**
   * Get registered mail information by ID
   */
  async getMail(mailId: string): Promise<MailResponse> {
    try {
      const response = await this.axiosInstance.get('/mail', {
        params: { id: mailId },
      });

      if (!response.data) {
        throw new Ar24MailNotFoundException(mailId);
      }

      return this.mapMailResponse(response.data);
    } catch (error) {
      if (error instanceof Ar24MailNotFoundException) {
        throw error;
      }
      throw new Ar24ApiException(500, `Failed to get mail: ${error.message}`);
    }
  }

  /**
   * List registered mails for a user
   */
  async listMails(dto: ListMailsDto): Promise<ListMailsResponse> {
    try {
      const params: Record<string, unknown> = {
        id_user: dto.idUser,
      };

      if (dto.dateFrom) {
        params.date_from = dto.dateFrom.toISOString();
      }
      if (dto.dateTo) {
        params.date_to = dto.dateTo.toISOString();
      }
      if (dto.reference) {
        params.ref_dossier = dto.reference;
      }

      const response = await this.axiosInstance.get('/user/mail', { params });

      const mails = Array.isArray(response.data) ? response.data : response.data.data || [];

      return {
        data: mails.map((mail: Record<string, unknown>) => this.mapMailResponse(mail)),
        total: response.data.total || mails.length,
        page: dto.page || 1,
        limit: dto.limit || 50,
      };
    } catch (error) {
      throw new Ar24ApiException(500, `Failed to list mails: ${error.message}`);
    }
  }

  /**
   * Upload an attachment
   */
  async uploadAttachment(dto: UploadAttachmentDto): Promise<AttachmentResponse> {
    try {
      // Check file size (256MB limit)
      const maxSize = 256 * 1024 * 1024;
      if (dto.file.length > maxSize) {
        throw new Ar24AttachmentSizeException(dto.file.length);
      }

      const formData = new FormData();
      formData.append('file', dto.file, dto.filename);
      formData.append('id_user', dto.idUser);
      formData.append('file_name', dto.filename);

      const response = await this.axiosInstance.post('/attachment', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      this.logger.log(`Attachment uploaded successfully: ${dto.filename}`);

      return {
        id: response.data.id,
        idUser: dto.idUser,
        filename: dto.filename,
        size: dto.file.length,
        mimeType: dto.mimeType || 'application/octet-stream',
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
    } catch (error) {
      if (error instanceof Ar24AttachmentSizeException) {
        throw error;
      }
      throw new Ar24AttachmentUploadException(dto.filename, error.message);
    }
  }

  /**
   * Download a proof document
   */
  async downloadProof(
    mailId: string,
    proofType: 'ev' | 'ar' | 'ng' | 'rf',
  ): Promise<DownloadAttachmentResponse> {
    try {
      const mail = await this.getMail(mailId);

      let proofUrl: string;
      switch (proofType) {
        case 'ev':
          proofUrl = mail.proofEvUrl;
          break;
        case 'ar':
          proofUrl = mail.proofArUrl;
          break;
        case 'ng':
          proofUrl = mail.proofNgUrl;
          break;
        case 'rf':
          proofUrl = mail.proofRfUrl;
          break;
      }

      if (!proofUrl) {
        throw new Ar24ProofNotFoundException(proofType, mailId);
      }

      const response = await axios.get(proofUrl, {
        responseType: 'arraybuffer',
      });

      return {
        data: Buffer.from(response.data),
        filename: `proof_${proofType}_${mailId}.pdf`,
        contentType: response.headers['content-type'] || 'application/pdf',
      };
    } catch (error) {
      if (error instanceof Ar24ProofNotFoundException) {
        throw error;
      }
      throw new Ar24ApiException(500, `Failed to download proof: ${error.message}`);
    }
  }

  /**
   * Configure a webhook
   */
  async configureWebhook(dto: WebhookConfigDto): Promise<WebhookResponse> {
    try {
      const payload = {
        url: dto.url,
        event_type: dto.eventType,
        active: dto.active !== false,
      };

      const response = await this.axiosInstance.post('/webhooks', payload);

      this.logger.log(`Webhook configured: ${dto.url} for ${dto.eventType}`);

      return {
        id: response.data.id,
        url: dto.url,
        eventType: dto.eventType,
        active: dto.active !== false,
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Ar24WebhookException(error.message);
    }
  }

  /**
   * Map AR24 API response to internal MailResponse format
   */
  private mapMailResponse(data: Record<string, unknown>): MailResponse {
    return {
      id: data.id as string,
      idUser: data.id_user as string,
      status: this.mapStatus(data.status as string),
      reference: data.ref_dossier as string,
      createdAt: new Date(data.created_at as string),
      sentAt: data.sent_at ? new Date(data.sent_at as string) : undefined,
      viewedAt: data.viewed_at ? new Date(data.viewed_at as string) : undefined,
      proofEvUrl: data.proof_ev_url as string,
      proofArUrl: data.proof_ar_url as string,
      proofNgUrl: data.proof_ng_url as string,
      proofRfUrl: data.proof_rf_url as string,
      recipient: {
        firstname: data.to_firstname as string,
        lastname: data.to_lastname as string,
        email: data.to_email as string,
        company: data.to_company as string,
      },
      eidas: Boolean(data.eidas),
    };
  }

  /**
   * Map AR24 status to internal status enum
   */
  private mapStatus(status: string): MailStatus {
    const statusMap: Record<string, MailStatus> = {
      sent: MailStatus.SENT,
      viewed: MailStatus.VIEWED,
      refused: MailStatus.REFUSED,
      negligence: MailStatus.NEGLIGENCE,
      pending: MailStatus.PENDING,
    };
    return statusMap[status] || MailStatus.PENDING;
  }
}
