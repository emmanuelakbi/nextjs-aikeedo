/**
 * Credit Validation Utilities
 * Ensures credit operations are safe and within valid ranges
 */

export class CreditValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CreditValidationError';
  }
}

const MAX_CREDITS = 1_000_000_000; // 1 billion credits maximum

export function validateCreditAmount(amount: number, context: string): void {
  // Check for number type
  if (typeof amount !== 'number') {
    throw new CreditValidationError(
      `${context}: Credit amount must be a number`,
      'INVALID_TYPE'
    );
  }

  // Check for NaN
  if (isNaN(amount)) {
    throw new CreditValidationError(
      `${context}: Credit amount cannot be NaN`,
      'INVALID_NUMBER'
    );
  }

  // Check for infinity
  if (!isFinite(amount)) {
    throw new CreditValidationError(
      `${context}: Credit amount must be finite`,
      'INFINITE_VALUE'
    );
  }

  // Check for integer
  if (!Number.isInteger(amount)) {
    throw new CreditValidationError(
      `${context}: Credit amount must be an integer`,
      'NOT_INTEGER'
    );
  }

  // Check for positive
  if (amount <= 0) {
    throw new CreditValidationError(
      `${context}: Credit amount must be positive`,
      'NOT_POSITIVE'
    );
  }

  // Check for safe integer range
  if (!Number.isSafeInteger(amount)) {
    throw new CreditValidationError(
      `${context}: Credit amount exceeds safe integer range`,
      'UNSAFE_INTEGER'
    );
  }

  // Check reasonable maximum
  if (amount > MAX_CREDITS) {
    throw new CreditValidationError(
      `${context}: Credit amount exceeds maximum allowed (${MAX_CREDITS})`,
      'EXCEEDS_MAXIMUM'
    );
  }
}

export function validateCreditBalance(balance: number, context: string): void {
  if (typeof balance !== 'number' || isNaN(balance) || !isFinite(balance)) {
    throw new CreditValidationError(
      `${context}: Invalid credit balance`,
      'INVALID_BALANCE'
    );
  }

  if (balance < 0) {
    throw new CreditValidationError(
      `${context}: Credit balance cannot be negative`,
      'NEGATIVE_BALANCE'
    );
  }

  if (!Number.isSafeInteger(balance)) {
    throw new CreditValidationError(
      `${context}: Credit balance exceeds safe integer range`,
      'UNSAFE_BALANCE'
    );
  }

  if (balance > MAX_CREDITS) {
    throw new CreditValidationError(
      `${context}: Credit balance exceeds maximum allowed (${MAX_CREDITS})`,
      'EXCEEDS_MAXIMUM'
    );
  }
}

export function validateCreditOperation(
  currentBalance: number,
  amount: number,
  operation: 'add' | 'remove',
  context: string
): void {
  validateCreditBalance(currentBalance, `${context} - current balance`);
  validateCreditAmount(amount, `${context} - operation amount`);

  if (operation === 'add') {
    const newBalance = currentBalance + amount;
    if (newBalance > MAX_CREDITS) {
      throw new CreditValidationError(
        `${context}: Operation would exceed maximum credit balance`,
        'EXCEEDS_MAXIMUM'
      );
    }
  } else if (operation === 'remove') {
    if (amount > currentBalance) {
      throw new CreditValidationError(
        `${context}: Insufficient credits (have: ${currentBalance}, need: ${amount})`,
        'INSUFFICIENT_CREDITS'
      );
    }
  }
}
