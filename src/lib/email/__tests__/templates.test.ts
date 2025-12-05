/**
 * Email template tests
 * Tests email template rendering and content
 */

import { describe, it, expect } from 'vitest';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
} from '../templates';

describe('Email Templates', () => {
  describe('verificationEmailTemplate', () => {
    it('should render verification email with all required content', () => {
      const data = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify?token=abc123',
        appName: 'TestApp',
      };

      const result = verificationEmailTemplate(data);

      expect(result.subject).toContain('Email verification required');
      expect(result.subject).toContain('TestApp');
      expect(result.html).toContain('John');
      expect(result.html).toContain(data.verificationUrl);
      expect(result.html).toContain('Verify Your Email');
      expect(result.text).toContain('John');
      expect(result.text).toContain(data.verificationUrl);
    });

    it('should use default app name when not provided', () => {
      const data = {
        firstName: 'Jane',
        verificationUrl: 'https://example.com/verify?token=xyz789',
      };

      const result = verificationEmailTemplate(data);

      expect(result.subject).toContain('AIKEEDO');
      expect(result.html).toContain('AIKEEDO');
    });

    it('should include both button and plain link in HTML', () => {
      const data = {
        firstName: 'Bob',
        verificationUrl: 'https://example.com/verify?token=test',
      };

      const result = verificationEmailTemplate(data);

      // Should have button link
      expect(result.html).toContain('class="button"');
      expect(result.html).toContain(data.verificationUrl);
      // Should also have plain text link for accessibility
      // Escape special regex characters in URL
      const escapedUrl = data.verificationUrl.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      const matches = result.html.match(new RegExp(escapedUrl, 'g'));
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(1);
    });
  });

  describe('passwordResetEmailTemplate', () => {
    it('should render password reset email with all required content', () => {
      const data = {
        firstName: 'Alice',
        resetUrl: 'https://example.com/reset?token=reset123',
        appName: 'TestApp',
      };

      const result = passwordResetEmailTemplate(data);

      expect(result.subject).toContain('Password Reset Request');
      expect(result.subject).toContain('TestApp');
      expect(result.html).toContain('Alice');
      expect(result.html).toContain(data.resetUrl);
      expect(result.html).toContain('Reset Your Password');
      expect(result.text).toContain('Alice');
      expect(result.text).toContain(data.resetUrl);
    });

    it('should include warning about ignoring if not requested', () => {
      const data = {
        firstName: 'Charlie',
        resetUrl: 'https://example.com/reset?token=test',
      };

      const result = passwordResetEmailTemplate(data);

      expect(result.html).toContain('please ignore');
      expect(result.text).toContain('please ignore');
    });

    it('should use default app name when not provided', () => {
      const data = {
        firstName: 'David',
        resetUrl: 'https://example.com/reset?token=test',
      };

      const result = passwordResetEmailTemplate(data);

      expect(result.subject).toContain('AIKEEDO');
      expect(result.html).toContain('AIKEEDO');
    });
  });

  describe('welcomeEmailTemplate', () => {
    it('should render welcome email with all required content', () => {
      const data = {
        firstName: 'Emma',
        appName: 'TestApp',
      };

      const result = welcomeEmailTemplate(data);

      expect(result.subject).toContain('Welcome to TestApp');
      expect(result.html).toContain('Emma');
      expect(result.html).toContain('TestApp');
      expect(result.html).toContain('thrilled to have you');
      expect(result.text).toContain('Emma');
      expect(result.text).toContain('TestApp');
    });

    it('should use default app name when not provided', () => {
      const data = {
        firstName: 'Frank',
      };

      const result = welcomeEmailTemplate(data);

      expect(result.subject).toContain('AIKEEDO');
      expect(result.html).toContain('AIKEEDO');
    });
  });

  describe('Template consistency', () => {
    it('should include HTML layout structure in all templates', () => {
      const templates = [
        verificationEmailTemplate({
          firstName: 'Test',
          verificationUrl: 'https://example.com',
        }),
        passwordResetEmailTemplate({
          firstName: 'Test',
          resetUrl: 'https://example.com',
        }),
        welcomeEmailTemplate({ firstName: 'Test' }),
      ];

      templates.forEach((template) => {
        expect(template.html).toContain('<!DOCTYPE html>');
        expect(template.html).toContain('<html');
        expect(template.html).toContain('</html>');
        expect(template.html).toContain('class="container"');
        expect(template.html).toContain('class="footer"');
      });
    });

    it('should provide plain text version for all templates', () => {
      const templates = [
        verificationEmailTemplate({
          firstName: 'Test',
          verificationUrl: 'https://example.com',
        }),
        passwordResetEmailTemplate({
          firstName: 'Test',
          resetUrl: 'https://example.com',
        }),
        welcomeEmailTemplate({ firstName: 'Test' }),
      ];

      templates.forEach((template) => {
        expect(template.text).toBeTruthy();
        expect(template.text.length).toBeGreaterThan(0);
        // Plain text should not contain HTML tags
        expect(template.text).not.toContain('<');
        expect(template.text).not.toContain('>');
      });
    });
  });
});
