import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Mailjet = require('node-mailjet');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mailjet: any;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private configService: ConfigService) {
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
            HTMLPart: this.getInvitationTemplate({
              tenantName,
              inviterName,
              invitationLink,
            }),
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
            HTMLPart: this.getWelcomeTemplate({ toName, tenantName }),
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

  /**
   * Get invitation email template
   */
  private getInvitationTemplate(params: {
    tenantName: string;
    inviterName: string;
    invitationLink: string;
  }): string {
    const { tenantName, inviterName, invitationLink } = params;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background-color: #4338CA; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong>.</p>
              <p>Click the button below to accept the invitation and get started:</p>
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">
                ${invitationLink}
              </p>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                This invitation will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.senderName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get welcome email template
   */
  private getWelcomeTemplate(params: { toName: string; tenantName: string }): string {
    const { toName, tenantName } = params;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${tenantName}!</h1>
            </div>
            <div class="content">
              <p>Hello ${toName},</p>
              <p>Welcome! We're excited to have you on board.</p>
              <p>You now have access to <strong>${tenantName}</strong> and can start collaborating with your team.</p>
              <p style="margin-top: 30px;">If you have any questions, feel free to reach out to your team administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.senderName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
