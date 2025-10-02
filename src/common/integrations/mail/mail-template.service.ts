import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import {
  InvitationTemplateData,
  WelcomeTemplateData,
  BaseTemplateData,
} from './interfaces/template-data.interface';

@Injectable()
export class MailTemplateService implements OnModuleInit {
  private readonly logger = new Logger(MailTemplateService.name);
  private readonly templatesPath: string;
  private readonly compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private layoutTemplate: HandlebarsTemplateDelegate;

  constructor(private configService: ConfigService) {
    this.templatesPath = path.join(__dirname, 'templates');
  }

  /**
   * Initialize templates on module startup
   */
  async onModuleInit() {
    this.registerPartials();
    this.registerHelpers();
    this.compileLayout();
    this.compileTemplates();
    this.logger.log('Email templates initialized successfully');
  }

  /**
   * Register Handlebars partials
   */
  private registerPartials(): void {
    const partialsPath = path.join(this.templatesPath, 'partials');
    const partialFiles = ['header.hbs', 'footer.hbs', 'button.hbs'];

    partialFiles.forEach((file) => {
      const partialName = path.basename(file, '.hbs');
      const partialPath = path.join(partialsPath, file);
      const partialContent = fs.readFileSync(partialPath, 'utf-8');
      Handlebars.registerPartial(partialName, partialContent);
      this.logger.debug(`Registered partial: ${partialName}`);
    });
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper to format dates
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Helper to uppercase text
    Handlebars.registerHelper('uppercase', (text: string) => {
      return text.toUpperCase();
    });

    this.logger.debug('Registered Handlebars helpers');
  }

  /**
   * Compile the base layout
   */
  private compileLayout(): void {
    const layoutPath = path.join(this.templatesPath, 'layouts', 'base.hbs');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    this.layoutTemplate = Handlebars.compile(layoutContent);
    this.logger.debug('Compiled base layout');
  }

  /**
   * Compile all email templates
   */
  private compileTemplates(): void {
    const templateFiles = ['invitation.hbs', 'welcome.hbs'];

    templateFiles.forEach((file) => {
      const templateName = path.basename(file, '.hbs');
      const templatePath = path.join(this.templatesPath, file);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateContent);
      this.compiledTemplates.set(templateName, compiledTemplate);
      this.logger.debug(`Compiled template: ${templateName}`);
    });
  }

  /**
   * Render a template with layout
   */
  private render(templateName: string, data: any, title: string): string {
    const template = this.compiledTemplates.get(templateName);

    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Render the template body
    const body = template(data);

    // Wrap with layout
    return this.layoutTemplate({ title, body });
  }

  /**
   * Get base template data
   */
  private getBaseData(): BaseTemplateData {
    return {
      senderName: this.configService.get<string>('mailjet.senderName'),
      currentYear: new Date().getFullYear(),
    };
  }

  /**
   * Render invitation email
   */
  renderInvitation(data: Omit<InvitationTemplateData, keyof BaseTemplateData>): string {
    const fullData: InvitationTemplateData = {
      ...this.getBaseData(),
      ...data,
    };

    return this.render('invitation', fullData, `Invitation to join ${data.tenantName}`);
  }

  /**
   * Render welcome email
   */
  renderWelcome(data: Omit<WelcomeTemplateData, keyof BaseTemplateData>): string {
    const fullData: WelcomeTemplateData = {
      ...this.getBaseData(),
      ...data,
    };

    return this.render('welcome', fullData, `Welcome to ${data.tenantName}!`);
  }
}
