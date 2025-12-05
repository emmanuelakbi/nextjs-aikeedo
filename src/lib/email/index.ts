/**
 * Email module exports
 * Provides email service and template functions
 */

export { EmailService, getEmailService, sendEmail } from './service';
export {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  creditPurchaseReceiptTemplate,
  invoiceEmailTemplate,
} from './templates';
export {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendCreditPurchaseReceipt,
  sendInvoiceEmail,
  sendRefundConfirmation,
  sendOverageNotification,
} from './helpers';
export type {
  EmailConfig,
  EmailOptions,
  VerificationEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
  CreditPurchaseReceiptData,
  InvoiceEmailData,
} from './types';
