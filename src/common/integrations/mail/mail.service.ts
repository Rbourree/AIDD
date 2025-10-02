import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailTemplateService } from './mail-template.service';
const Mailjet = require('node-mailjet');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mailjet: any;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(
    private configService: ConfigService,
    private mailTemplateService: MailTemplateService,
  ) {
    const apiKey = this.configService.get<string>('mailjet.apiKey');
    const secretKey = this.configService.get<string>('mailjet.secretKey');

    this.mailjet = Mailjet.apiConnect(apiKey, secretKey);

    this.senderEmail = this.configService.get<string>('mailjet.senderEmail');
    this.senderName = this.configService.get<string>('mailjet.senderName');
  }

  /**
   * Send invitation email to a user
   */
  async sendInvitationEmail(params: {
    toEmail: string;
    toName?: string;
    tenantName: string;
    inviterName: string;
    invitationLink: string;
  }): Promise<void> {
    const { toEmail, toName, tenantName, inviterName, invitationLink } = params;

    try {
      const htmlContent = this.mailTemplateService.renderInvitation({
        tenantName,
        inviterName,
        invitationLink,
      });

      await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: this.senderEmail,
              Name: this.senderName,
            },
            To: [
              {
                Email: toEmail,
                Name: toName || toEmail,
              },
            ],
            Subject: `Invitation to join ${tenantName}`,
            HTMLPart: htmlContent,
          },
        ],
      });
      this.logger.log(`Invitation email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${toEmail}`, error);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Send welcome email to a new user
   */
  async sendWelcomeEmail(params: {
    toEmail: string;
    toName: string;
    tenantName: string;
  }): Promise<void> {
    const { toEmail, toName, tenantName } = params;

    try {
      const htmlContent = this.mailTemplateService.renderWelcome({
        toName,
        tenantName,
      });

      await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: this.senderEmail,
              Name: this.senderName,
            },
            To: [
              {
                Email: toEmail,
                Name: toName,
              },
            ],
            Subject: `Welcome to ${tenantName}!`,
            HTMLPart: htmlContent,
          },
        ],
      });
      this.logger.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${toEmail}`, error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send generic email
   */
  async sendEmail(params: {
    toEmail: string;
    toName?: string;
    subject: string;
    htmlContent: string;
  }): Promise<void> {
    const { toEmail, toName, subject, htmlContent } = params;

    try {
      await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: this.senderEmail,
              Name: this.senderName,
            },
            To: [
              {
                Email: toEmail,
                Name: toName || toEmail,
              },
            ],
            Subject: subject,
            HTMLPart: htmlContent,
          },
        ],
      });
      this.logger.log(`Email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}`, error);
      throw new Error('Failed to send email');
    }
  }
}
