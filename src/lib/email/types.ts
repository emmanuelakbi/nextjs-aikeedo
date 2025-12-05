/**
 * Email service types and interfaces
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  firstName: string;
  verificationUrl: string;
  appName?: string;
}

export interface PasswordResetEmailData {
  firstName: string;
  resetUrl: string;
  appName?: string;
}

export interface WelcomeEmailData {
  firstName: string;
  appName?: string;
}

export interface CreditPurchaseReceiptData {
  firstName: string;
  creditAmount: number;
  amountPaid: number;
  currency: string;
  transactionId: string;
  workspaceName: string;
  newBalance: number;
  appName?: string;
}

export interface InvoiceEmailData {
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
