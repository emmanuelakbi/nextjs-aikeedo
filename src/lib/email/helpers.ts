/**
 * Email helper functions
 * High-level functions for sending specific types of emails
 */

import { sendEmail } from './service';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
} from './templates';
import type {
  VerificationEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
} from './types';

/**
 * Send email verification email
 * @param to Recipient email address
 * @param data Verification email data
 */
export async function sendVerificationEmail(
  to: string,
  data: VerificationEmailData
): Promise<void> {
  const { subject, html, text } = verificationEmailTemplate(data);
  await sendEmail({ to, subject, html, text });
}

/**
 * Send password reset email
 * @param to Recipient email address
 * @param data Password reset email data
 */
export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetEmailData
): Promise<void> {
  const { subject, html, text } = passwordResetEmailTemplate(data);
  await sendEmail({ to, subject, html, text });
}

/**
 * Send welcome email
 * @param to Recipient email address
 * @param data Welcome email data
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<void> {
  const { subject, html, text } = welcomeEmailTemplate(data);
  await sendEmail({ to, subject, html, text });
}

/**
 * Send credit purchase receipt email
 * Requirements: 4.4
 * @param to Recipient email address
 * @param data Credit purchase receipt data
 */
export async function sendCreditPurchaseReceipt(
  to: string,
  data: {
    firstName: string;
    creditAmount: number;
    amountPaid: number;
    currency: string;
    transactionId: string;
    workspaceName: string;
    newBalance: number;
    appName?: string;
  }
): Promise<void> {
  const { creditPurchaseReceiptTemplate } = await import('./templates');
  const { subject, html, text } = creditPurchaseReceiptTemplate(data);
  await sendEmail({ to, subject, html, text });
}

/**
 * Send invoice email
 * Requirements: 5.5 - Email invoice to billing email
 * @param to Recipient email address
 * @param data Invoice email data
 */
export async function sendInvoiceEmail(
  to: string,
  data: {
    firstName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    paidAt: Date | null;
    invoiceUrl: string;
    invoicePdfUrl: string;
    lineItems: Array<{
      description: string;
      amount: number;
      quantity: number;
      unitAmount: number;
    }>;
    workspaceName: string;
    appName?: string;
  }
): Promise<void> {
  const { invoiceEmailTemplate } = await import('./templates');
  const { subject, html, text } = invoiceEmailTemplate(data);
  await sendEmail({ to, subject, html, text });
}

/**
 * Send refund confirmation email
 * Requirements: 11.3 - Send confirmation email
 * @param to Recipient email address
 * @param data Refund confirmation data
 */
export async function sendRefundConfirmation(
  to: string,
  data: {
    firstName: string;
    refundAmount: number;
    currency: string;
    refundId: string;
    status: string;
    appName?: string;
  }
): Promise<void> {
  const appName = data.appName || process.env.APP_NAME || 'AIKEEDO';
  
  const subject = `Refund Confirmation - ${appName}`;
  
  const html = `
    <h2>Refund Processed</h2>
    <p>Hi ${data.firstName},</p>
    <p>Your refund has been processed successfully.</p>
    <p><strong>Refund Details:</strong></p>
    <ul>
      <li>Amount: ${data.currency.toUpperCase()} ${data.refundAmount.toFixed(2)}</li>
      <li>Refund ID: ${data.refundId}</li>
      <li>Status: ${data.status}</li>
    </ul>
    <p>The refund will appear in your account within 5-10 business days.</p>
    <p>If you have any questions, please contact our support team.</p>
    <p>Best regards,<br>${appName} Team</p>
  `;
  
  const text = `
Refund Processed

Hi ${data.firstName},

Your refund has been processed successfully.

Refund Details:
- Amount: ${data.currency.toUpperCase()} ${data.refundAmount.toFixed(2)}
- Refund ID: ${data.refundId}
- Status: ${data.status}

The refund will appear in your account within 5-10 business days.

If you have any questions, please contact our support team.

Best regards,
${appName} Team
  `;
  
  await sendEmail({ to, subject, html, text });
}

/**
 * Send overage notification email
 * Requirements: 10.5 - Notify user of overage
 * @param to Recipient email address
 * @param data Overage notification data
 */
export async function sendOverageNotification(
  to: string,
  data: {
    firstName: string;
    workspaceName: string;
    overage: number;
    overageCharges: number;
    totalUsage: number;
    planLimit: number;
    billingPeriodEnd: string;
    appName?: string;
  }
): Promise<void> {
  const appName = data.appName || process.env.APP_NAME || 'AIKEEDO';
  
  const subject = `Usage Overage Alert - ${data.workspaceName}`;
  
  const html = `
    <h2>Usage Overage Alert</h2>
    <p>Hi ${data.firstName},</p>
    <p>Your workspace <strong>${data.workspaceName}</strong> has exceeded its credit limit for the current billing period.</p>
    <p><strong>Usage Summary:</strong></p>
    <ul>
      <li>Plan Limit: ${data.planLimit} credits</li>
      <li>Total Usage: ${data.totalUsage} credits</li>
      <li>Overage: ${data.overage} credits</li>
      <li>Overage Charges: $${data.overageCharges.toFixed(2)}</li>
    </ul>
    <p>These overage charges will be added to your next invoice on ${new Date(data.billingPeriodEnd).toLocaleDateString()}.</p>
    <p>To avoid future overage charges, consider upgrading to a higher plan or monitoring your usage more closely.</p>
    <p>Best regards,<br>${appName} Team</p>
  `;
  
  const text = `
Usage Overage Alert

Hi ${data.firstName},

Your workspace ${data.workspaceName} has exceeded its credit limit for the current billing period.

Usage Summary:
- Plan Limit: ${data.planLimit} credits
- Total Usage: ${data.totalUsage} credits
- Overage: ${data.overage} credits
- Overage Charges: $${data.overageCharges.toFixed(2)}

These overage charges will be added to your next invoice on ${new Date(data.billingPeriodEnd).toLocaleDateString()}.

To avoid future overage charges, consider upgrading to a higher plan or monitoring your usage more closely.

Best regards,
${appName} Team
  `;
  
  await sendEmail({ to, subject, html, text });
}
