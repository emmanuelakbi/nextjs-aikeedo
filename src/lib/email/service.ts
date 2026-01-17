/**
 * Email service for sending transactional emails
 * Uses nodemailer with SMTP configuration from environment variables
 */

import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailConfig, EmailOptions } from './types';
import { env } from '../env';

/**
 * Email service class
 * Handles SMTP connection and email sending with error handling
 */
export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    // Use provided config or load from environment
    if (config) {
      this.config = config;
    } else {
      // Validate that required SMTP environment variables are set
      const host = env.SMTP_HOST;
      const port = env.SMTP_PORT;
      const user = env.SMTP_USER;
      const password = env.SMTP_PASSWORD;
      const from = env.SMTP_FROM;

      if (!host || !port || !user || !password || !from) {
        throw new Error(
          'Email service requires SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM environment variables.'
        );
      }

      this.config = {
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass: password,
        },
        from,
      };
    }
  }

  /**
   * Get or create SMTP transporter
   * Lazy initialization to avoid connection on import
   */
  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });
    }
    return this.transporter;
  }

  /**
   * Send an email
   * @param options Email options (to, subject, html, text)
   * @returns Promise that resolves when email is sent
   * @throws Error if email sending fails
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });
    } catch (error) {
      // Log error for debugging but don't expose SMTP details
      console.error('Failed to send email:', {
        to: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error('Failed to send email. Please try again later.');
    }
  }

  /**
   * Verify SMTP connection
   * Useful for testing configuration
   * @returns Promise that resolves to true if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Close SMTP connection
   * Should be called when shutting down the application
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }

  /**
   * Strip HTML tags from string to create plain text version
   * Simple implementation for fallback text content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Singleton instance of email service
 * Use this throughout the application
 */
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

/**
 * Helper function to send email using the singleton instance
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const service = getEmailService();
  await service.sendEmail(options);
}
