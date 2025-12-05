/**
 * Email templates
 * Simple HTML email templates for various user actions
 */

import type {
  VerificationEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
} from './types';

/**
 * Base email layout wrapper
 */
function emailLayout(content: string, appName: string = 'AIKEEDO'): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.5;
        font-size: 16px;
        color: #3F4246;
        margin: 0;
        padding: 0;
        font-weight: normal;
        background-color: #F5F6F6;
      }

      a {
        font-weight: bold;
        color: #00A6FB;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      .container {
        max-width: 512px;
        margin: 0 auto;
        padding: 32px;
        border-radius: 16px;
        background-color: #FFFFFF;
        border: 1px solid #E3E4E4;
      }

      .logo {
        margin-bottom: 24px;
      }

      .button,
      a.button {
        display: inline-block;
        background: #3F4246;
        color: #ffffff !important;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
      }

      .button:hover,
      a.button:hover {
        text-decoration: none;
        background: #2F3236;
      }

      .footer {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #F5F6F6;
        font-size: 14px;
        color: #ACAEAF;
      }

      @media(min-width: 600px) {
        .container {
          padding: 64px;
          border-radius: 24px;
        }

        .logo {
          margin-bottom: 56px;
        }

        .button,
        a.button {
          border-radius: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Email verification template
 */
export function verificationEmailTemplate(data: VerificationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = data.appName || 'AIKEEDO';

  const content = `
    <div>
      <p>Dear <strong>${data.firstName}</strong>,</p>

      <p>
        To ensure the security of your account, please verify your email address.
      </p>

      <p>
        Click the button below to verify your email:
      </p>

      <p>
        <a href="${data.verificationUrl}" class="button">Verify Your Email</a>
      </p>

      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="word-break: break-all; color: #ACAEAF; font-size: 14px;">
        ${data.verificationUrl}
      </p>

      <p>
        Warm regards,<br/>
        <strong>${appName} team</strong>
      </p>
    </div>
  `;

  const text = `
Dear ${data.firstName},

To ensure the security of your account, please verify your email address.

Click the link below to verify your email:
${data.verificationUrl}

Warm regards,
${appName} team
  `.trim();

  return {
    subject: `Email verification required for your account - ${appName}`,
    html: emailLayout(content, appName),
    text,
  };
}

/**
 * Password reset email template
 */
export function passwordResetEmailTemplate(data: PasswordResetEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = data.appName || 'AIKEEDO';

  const content = `
    <div>
      <p>Dear <strong>${data.firstName}</strong>,</p>

      <p>
        We received a request to reset the password for your <strong>${appName}</strong>
        account associated with this email address. If you made this request, please follow 
        the instructions below to create a new password.
      </p>

      <p>
        <a href="${data.resetUrl}" class="button">Reset Your Password</a>
      </p>

      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="word-break: break-all; color: #ACAEAF; font-size: 14px;">
        ${data.resetUrl}
      </p>

      <p>
        If you didn't request a password reset, it's possible that someone else entered 
        your email address by mistake. If you did not initiate this request, please ignore 
        this email, and your password will remain the same.
      </p>

      <p>
        Warm regards,<br/>
        <strong>${appName} team</strong>
      </p>
    </div>
  `;

  const text = `
Dear ${data.firstName},

We received a request to reset the password for your ${appName} account associated with this email address.

Click the link below to reset your password:
${data.resetUrl}

If you didn't request a password reset, please ignore this email, and your password will remain the same.

Warm regards,
${appName} team
  `.trim();

  return {
    subject: `Password Reset Request - ${appName}`,
    html: emailLayout(content, appName),
    text,
  };
}

/**
 * Welcome email template
 */
export function welcomeEmailTemplate(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = data.appName || 'AIKEEDO';

  const content = `
    <div>
      <p>Dear <strong>${data.firstName}</strong>,</p>

      <p>
        Welcome to <strong>${appName}</strong>!
      </p>

      <p>
        We are thrilled to have you on board. Our team is committed to providing you 
        with an exceptional experience, and we are here to support you every step of the way.
      </p>

      <p>
        Get started by exploring our features and creating your first project.
      </p>

      <p>
        Warm regards,<br/>
        <strong>${appName} team</strong>
      </p>
    </div>
  `;

  const text = `
Dear ${data.firstName},

Welcome to ${appName}!

We are thrilled to have you on board. Our team is committed to providing you with an exceptional experience, and we are here to support you every step of the way.

Warm regards,
${appName} team
  `.trim();

  return {
    subject: `Welcome to ${appName}!`,
    html: emailLayout(content, appName),
    text,
  };
}

/**
 * Helper function to render verification email
 */
export function renderVerificationEmail(data: VerificationEmailData): string {
  return verificationEmailTemplate(data).html;
}

/**
 * Helper function to render password reset email
 */
export function renderPasswordResetEmail(data: PasswordResetEmailData): string {
  return passwordResetEmailTemplate(data).html;
}

/**
 * Helper function to render welcome email
 */
export function renderWelcomeEmail(data: WelcomeEmailData): string {
  return welcomeEmailTemplate(data).html;
}

/**
 * Credit purchase receipt email template
 * Requirements: 4.4
 */
export function creditPurchaseReceiptTemplate(data: {
  firstName: string;
  creditAmount: number;
  amountPaid: number;
  currency: string;
  transactionId: string;
  workspaceName: string;
  newBalance: number;
  appName?: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = data.appName || 'AIKEEDO';
  const currencySymbol = data.currency.toUpperCase() === 'USD' ? '$' : data.currency;

  const content = `
    <div>
      <p>Dear <strong>${data.firstName}</strong>,</p>

      <p>
        Thank you for your credit purchase! Your payment has been successfully processed.
      </p>

      <div style="background-color: #F5F6F6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #3F4246;">Purchase Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #ACAEAF;">Credits Purchased:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">
              ${data.creditAmount.toLocaleString()} credits
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #ACAEAF;">Amount Paid:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">
              ${currencySymbol}${data.amountPaid.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #ACAEAF;">Workspace:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">
              ${data.workspaceName}
            </td>
          </tr>
          <tr style="border-top: 2px solid #E3E4E4;">
            <td style="padding: 8px 0; color: #ACAEAF;">New Balance:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #00A6FB;">
              ${data.newBalance.toLocaleString()} credits
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #ACAEAF;">
        Transaction ID: ${data.transactionId}
      </p>

      <p>
        Your credits are now available and ready to use for AI services.
      </p>

      <p>
        If you have any questions about this transaction, please don't hesitate to contact our support team.
      </p>

      <p>
        Warm regards,<br/>
        <strong>${appName} team</strong>
      </p>
    </div>
  `;

  const text = `
Dear ${data.firstName},

Thank you for your credit purchase! Your payment has been successfully processed.

Purchase Details:
- Credits Purchased: ${data.creditAmount.toLocaleString()} credits
- Amount Paid: ${currencySymbol}${data.amountPaid.toFixed(2)}
- Workspace: ${data.workspaceName}
- New Balance: ${data.newBalance.toLocaleString()} credits

Transaction ID: ${data.transactionId}

Your credits are now available and ready to use for AI services.

If you have any questions about this transaction, please don't hesitate to contact our support team.

Warm regards,
${appName} team
  `.trim();

  return {
    subject: `Credit Purchase Receipt - ${appName}`,
    html: emailLayout(content, appName),
    text,
  };
}

/**
 * Invoice email template
 * Requirements: 5.5 - Email invoice to billing email
 */
export function invoiceEmailTemplate(data: {
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
}): {
  subject: string;
  html: string;
  text: string;
} {
  const appName = data.appName || 'AIKEEDO';
  const currencySymbol = data.currency.toUpperCase() === 'USD' ? '$' : data.currency;
  const isPaid = data.paidAt !== null;
  const statusText = isPaid ? 'Paid' : 'Pending';
  const statusColor = isPaid ? '#00A6FB' : '#ACAEAF';

  // Format line items
  const lineItemsHtml = data.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; color: #3F4246;">
            ${item.description}
            ${item.quantity > 1 ? `<span style="color: #ACAEAF;"> × ${item.quantity}</span>` : ''}
          </td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">
            ${currencySymbol}${(item.amount / 100).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

  const content = `
    <div>
      <p>Dear <strong>${data.firstName}</strong>,</p>

      <p>
        ${isPaid ? 'Thank you for your payment!' : 'You have a new invoice.'} 
        Here are the details of your invoice for <strong>${data.workspaceName}</strong>.
      </p>

      <div style="background-color: #F5F6F6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #3F4246;">Invoice ${data.invoiceNumber}</h3>
          <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: bold;">
            ${statusText}
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          ${lineItemsHtml}
          <tr style="border-top: 2px solid #E3E4E4;">
            <td style="padding: 12px 0; color: #3F4246; font-weight: bold;">Total</td>
            <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #3F4246;">
              ${currencySymbol}${data.amount.toFixed(2)}
            </td>
          </tr>
        </table>

        ${
          isPaid && data.paidAt
            ? `
          <p style="margin-top: 16px; margin-bottom: 0; font-size: 14px; color: #ACAEAF;">
            Paid on ${new Date(data.paidAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        `
            : ''
        }
      </div>

      <p>
        <a href="${data.invoiceUrl}" class="button">View Invoice</a>
        ${data.invoicePdfUrl ? `<a href="${data.invoicePdfUrl}" style="margin-left: 12px;">Download PDF</a>` : ''}
      </p>

      <p style="font-size: 14px; color: #ACAEAF;">
        Invoice Number: ${data.invoiceNumber}
      </p>

      <p>
        If you have any questions about this invoice, please don't hesitate to contact our support team.
      </p>

      <p>
        Warm regards,<br/>
        <strong>${appName} team</strong>
      </p>
    </div>
  `;

  const lineItemsText = data.lineItems
    .map(
      (item) =>
        `- ${item.description}${item.quantity > 1 ? ` × ${item.quantity}` : ''}: ${currencySymbol}${(item.amount / 100).toFixed(2)}`
    )
    .join('\n');

  const text = `
Dear ${data.firstName},

${isPaid ? 'Thank you for your payment!' : 'You have a new invoice.'} Here are the details of your invoice for ${data.workspaceName}.

Invoice ${data.invoiceNumber} - ${statusText}

${lineItemsText}

Total: ${currencySymbol}${data.amount.toFixed(2)}

${isPaid && data.paidAt ? `Paid on ${new Date(data.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

View Invoice: ${data.invoiceUrl}
${data.invoicePdfUrl ? `Download PDF: ${data.invoicePdfUrl}` : ''}

Invoice Number: ${data.invoiceNumber}

If you have any questions about this invoice, please don't hesitate to contact our support team.

Warm regards,
${appName} team
  `.trim();

  return {
    subject: `Invoice ${data.invoiceNumber} - ${appName}`,
    html: emailLayout(content, appName),
    text,
  };
}
