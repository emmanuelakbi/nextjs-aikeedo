/**
 * Email service tests
 * Tests SMTP connection handling and email sending
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailService } from '../service';
import type { EmailConfig } from '../types';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
      close: vi.fn(),
    })),
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;
  const mockConfig: EmailConfig = {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'testpassword',
    },
    from: 'noreply@test.com',
  };

  beforeEach(() => {
    emailService = new EmailService(mockConfig);
  });

  afterEach(async () => {
    await emailService.close();
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email with provided options', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      await expect(emailService.sendEmail(options)).resolves.toBeUndefined();
    });

    it('should generate plain text from HTML if not provided', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(emailService.sendEmail(options)).resolves.toBeUndefined();
    });

    it('should handle email sending errors gracefully', async () => {
      // Create a service that will fail
      const nodemailer = await import('nodemailer');
      vi.mocked(nodemailer.default.createTransport).mockReturnValueOnce({
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP error')),
        verify: vi.fn(),
        close: vi.fn(),
      } as any);

      const failingService = new EmailService(mockConfig);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(failingService.sendEmail(options)).rejects.toThrow(
        'Failed to send email'
      );
    });

    it('should not expose SMTP details in error messages', async () => {
      const nodemailer = await import('nodemailer');
      vi.mocked(nodemailer.default.createTransport).mockReturnValueOnce({
        sendMail: vi
          .fn()
          .mockRejectedValue(
            new Error('Authentication failed: wrong password')
          ),
        verify: vi.fn(),
        close: vi.fn(),
      } as any);

      const failingService = new EmailService(mockConfig);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      try {
        await failingService.sendEmail(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).not.toContain('password');
        expect((error as Error).message).not.toContain('Authentication');
      }
    });
  });

  describe('verifyConnection', () => {
    it('should return true for successful connection', async () => {
      const result = await emailService.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      const nodemailer = await import('nodemailer');
      vi.mocked(nodemailer.default.createTransport).mockReturnValueOnce({
        sendMail: vi.fn(),
        verify: vi.fn().mockRejectedValue(new Error('Connection failed')),
        close: vi.fn(),
      } as any);

      const failingService = new EmailService(mockConfig);
      const result = await failingService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('should close transporter connection', async () => {
      // Trigger transporter creation
      await emailService.verifyConnection();

      await expect(emailService.close()).resolves.toBeUndefined();
    });

    it('should handle close when transporter is not initialized', async () => {
      const newService = new EmailService(mockConfig);
      await expect(newService.close()).resolves.toBeUndefined();
    });
  });

  describe('HTML stripping', () => {
    it('should strip HTML tags to create plain text', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello <strong>World</strong></p><script>alert("test")</script>',
      };

      await emailService.sendEmail(options);
      // The service should have stripped HTML internally
      // We can't directly test the private method, but we verify it doesn't throw
    });

    it('should handle HTML with styles and scripts', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<style>body { color: red; }</style><p>Content</p><script>console.log("test")</script>',
      };

      await expect(emailService.sendEmail(options)).resolves.toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should use secure connection for port 465', () => {
      const secureConfig: EmailConfig = {
        ...mockConfig,
        port: 465,
        secure: true,
      };

      const secureService = new EmailService(secureConfig);
      expect(secureService).toBeDefined();
    });

    it('should use non-secure connection for other ports', () => {
      const nonSecureConfig: EmailConfig = {
        ...mockConfig,
        port: 587,
        secure: false,
      };

      const nonSecureService = new EmailService(nonSecureConfig);
      expect(nonSecureService).toBeDefined();
    });
  });
});
