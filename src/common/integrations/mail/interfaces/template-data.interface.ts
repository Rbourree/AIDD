/**
 * Base data for all email templates
 */
export interface BaseTemplateData {
  senderName: string;
  currentYear: number;
}

/**
 * Data for invitation email template
 */
export interface InvitationTemplateData extends BaseTemplateData {
  tenantName: string;
  inviterName: string;
  invitationLink: string;
}

/**
 * Data for welcome email template
 */
export interface WelcomeTemplateData extends BaseTemplateData {
  toName: string;
  tenantName: string;
}
