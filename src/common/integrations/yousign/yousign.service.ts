import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import {
  CreateSignatureRequestDto,
  SignatureRequestResponse,
  ListSignatureRequestsParams,
  SignatureRequestListResponse,
} from './interfaces/signature-request.interface';
import { UploadDocumentDto, DocumentResponse, DownloadDocumentResponse } from './interfaces/document.interface';
import { AddSignerDto, SignerResponse } from './interfaces/signer.interface';
import {
  YousignApiException,
  YousignAuthenticationException,
  YousignDocumentUploadException,
  YousignSignatureRequestNotFoundException,
  YousignInvalidRequestException,
  YousignRateLimitException,
  YousignDocumentDownloadException,
  YousignSignatureRequestNotReadyException,
} from './exceptions/yousign.exceptions';

@Injectable()
export class YousignService {
  private readonly logger = new Logger(YousignService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('yousign.apiKey');
    const environment = this.configService.get<string>('yousign.environment') || 'sandbox';

    if (!apiKey) {
      throw new YousignAuthenticationException('Yousign API key is not configured');
    }

    this.baseUrl =
      environment === 'production'
        ? 'https://api.yousign.app/v3'
        : 'https://api-sandbox.yousign.app/v3';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger.log(`Yousign service initialized in ${environment} mode`);
  }

  /**
   * Create a new signature request
   */
  async createSignatureRequest(
    dto: CreateSignatureRequestDto,
  ): Promise<SignatureRequestResponse> {
    try {
      const response = await this.axiosInstance.post<SignatureRequestResponse>(
        '/signature_requests',
        {
          name: dto.name,
          delivery_mode: dto.deliveryMode || 'email',
          timezone: dto.timezone || 'Europe/Paris',
          ...(dto.expirationDate && { expiration_date: dto.expirationDate.toISOString() }),
          ...(dto.reminderSettings && { reminder_settings: dto.reminderSettings }),
        },
      );

      this.logger.log(`Signature request created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Failed to create signature request');
    }
  }

  /**
   * Upload a document to a signature request
   */
  async uploadDocument(
    signatureRequestId: string,
    dto: UploadDocumentDto,
  ): Promise<DocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', dto.file, dto.filename);
      formData.append('nature', dto.nature);

      if (dto.parseAnchors !== undefined) {
        formData.append('parse_anchors', dto.parseAnchors.toString());
      }

      const response = await this.axiosInstance.post<DocumentResponse>(
        `/signature_requests/${signatureRequestId}/documents`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      this.logger.log(
        `Document uploaded: ${response.data.id} to signature request ${signatureRequestId}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new YousignDocumentUploadException(dto.filename, error.response?.data?.message);
      }
      throw new YousignDocumentUploadException(dto.filename);
    }
  }

  /**
   * Add a signer to a signature request
   */
  async addSigner(
    signatureRequestId: string,
    dto: AddSignerDto,
  ): Promise<SignerResponse> {
    try {
      const response = await this.axiosInstance.post<SignerResponse>(
        `/signature_requests/${signatureRequestId}/signers`,
        {
          info: dto.info,
          signature_level: dto.signatureLevel,
          signature_authentication_mode: dto.signatureAuthenticationMode,
          fields: dto.fields.map((field) => ({
            document_id: field.documentId,
            type: field.type,
            page: field.page,
            x: field.x,
            y: field.y,
            ...(field.width && { width: field.width }),
            ...(field.height && { height: field.height }),
            ...(field.mention && { mention: field.mention }),
            ...(field.mention2 && { mention2: field.mention2 }),
            ...(field.optional !== undefined && { optional: field.optional }),
          })),
          ...(dto.redirectUrls && { redirect_urls: dto.redirectUrls }),
        },
      );

      this.logger.log(
        `Signer added: ${response.data.id} (${dto.info.email}) to signature request ${signatureRequestId}`,
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Failed to add signer');
    }
  }

  /**
   * Activate a signature request (sends emails to signers)
   */
  async activateSignatureRequest(signatureRequestId: string): Promise<SignatureRequestResponse> {
    try {
      const response = await this.axiosInstance.post<SignatureRequestResponse>(
        `/signature_requests/${signatureRequestId}/activate`,
      );

      this.logger.log(`Signature request activated: ${signatureRequestId}`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Failed to activate signature request');
    }
  }

  /**
   * Get a signature request by ID
   */
  async getSignatureRequest(signatureRequestId: string): Promise<SignatureRequestResponse> {
    try {
      const response = await this.axiosInstance.get<SignatureRequestResponse>(
        `/signature_requests/${signatureRequestId}`,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new YousignSignatureRequestNotFoundException(signatureRequestId);
      }
      this.handleAxiosError(error, 'Failed to get signature request');
    }
  }

  /**
   * List signature requests with pagination
   */
  async listSignatureRequests(
    params?: ListSignatureRequestsParams,
  ): Promise<SignatureRequestListResponse> {
    try {
      const queryParams: Record<string, string> = {};

      if (params?.status) {
        queryParams.status = params.status.join(',');
      }
      if (params?.limit) {
        queryParams.limit = params.limit.toString();
      }
      if (params?.after) {
        queryParams.after = params.after;
      }

      const response = await this.axiosInstance.get<SignatureRequestListResponse>(
        '/signature_requests',
        { params: queryParams },
      );

      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Failed to list signature requests');
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(
    signatureRequestId: string,
    documentId: string,
  ): Promise<DownloadDocumentResponse> {
    try {
      // First check if signature request is completed
      const signatureRequest = await this.getSignatureRequest(signatureRequestId);

      if (signatureRequest.status !== 'done') {
        throw new YousignSignatureRequestNotReadyException(signatureRequest.status);
      }

      const response = await this.axiosInstance.get(
        `/signature_requests/${signatureRequestId}/documents/${documentId}/download`,
        {
          responseType: 'arraybuffer',
        },
      );

      const filename =
        response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') ||
        'signed_document.pdf';

      const contentType = response.headers['content-type'] || 'application/pdf';

      return {
        data: Buffer.from(response.data),
        filename,
        contentType,
      };
    } catch (error) {
      if (error instanceof YousignSignatureRequestNotReadyException) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        throw new YousignDocumentDownloadException(documentId, error.response?.data?.message);
      }
      throw new YousignDocumentDownloadException(documentId);
    }
  }

  /**
   * Cancel a signature request
   */
  async cancelSignatureRequest(signatureRequestId: string, reason?: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/signature_requests/${signatureRequestId}/cancel`, {
        ...(reason && { reason }),
      });

      this.logger.log(`Signature request canceled: ${signatureRequestId}`);
    } catch (error) {
      this.handleAxiosError(error, 'Failed to cancel signature request');
    }
  }

  /**
   * Handle axios errors and convert to appropriate exceptions
   */
  private handleAxiosError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = (axiosError.response.data as any)?.message || defaultMessage;

        this.logger.error(`Yousign API error (${status}): ${message}`, axiosError.stack);

        switch (status) {
          case 401:
            throw new YousignAuthenticationException(message);
          case 400:
            throw new YousignInvalidRequestException(message);
          case 404:
            throw new YousignApiException(`Resource not found: ${message}`, 404);
          case 429:
            throw new YousignRateLimitException();
          default:
            throw new YousignApiException(message, status);
        }
      }

      if (axiosError.request) {
        this.logger.error(`Yousign API no response: ${defaultMessage}`, axiosError.stack);
        throw new YousignApiException('No response from Yousign API', 503);
      }
    }

    this.logger.error(`Unexpected error: ${defaultMessage}`, error);
    throw new YousignApiException(defaultMessage);
  }
}
