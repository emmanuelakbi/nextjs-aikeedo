/**
 * PhoneNumber Value Object
 *
 * Represents a validated and formatted phone number.
 * Immutable value object that ensures phone number format correctness.
 */

export class PhoneNumber {
  private readonly value: string;
  private readonly formatted: string;

  private constructor(value: string, formatted: string) {
    this.value = value;
    this.formatted = formatted;
  }

  /**
   * Creates a PhoneNumber value object from a string
   * @throws Error if phone number format is invalid
   */
  static create(phoneNumber: string): PhoneNumber {
    const trimmed = phoneNumber.trim();

    if (!trimmed) {
      throw new Error('Phone number cannot be empty');
    }

    // Remove all non-digit characters except + at the start
    const cleaned = trimmed.replace(/[^\d+]/g, '');

    // Extract digits only for validation
    const digitsOnly = cleaned.replace(/\+/g, '');

    if (!digitsOnly) {
      throw new Error('Phone number must contain digits');
    }

    // Validate length (international format: 7-15 digits)
    if (digitsOnly.length < 7) {
      throw new Error('Phone number is too short (minimum 7 digits)');
    }

    if (digitsOnly.length > 15) {
      throw new Error('Phone number is too long (maximum 15 digits)');
    }

    // Validate format: must start with + for international or be all digits
    if (cleaned.startsWith('+')) {
      if (!/^\+\d{7,15}$/.test(cleaned)) {
        throw new Error('Invalid international phone number format');
      }
    } else {
      if (!/^\d{7,15}$/.test(cleaned)) {
        throw new Error('Invalid phone number format');
      }
    }

    // Format the phone number
    const formatted = PhoneNumber.format(cleaned);

    return new PhoneNumber(cleaned, formatted);
  }

  /**
   * Formats a phone number for display
   */
  private static format(phoneNumber: string): string {
    // If international format
    if (phoneNumber.startsWith('+')) {
      const countryCode = phoneNumber.substring(0, phoneNumber.length - 10);
      const remaining = phoneNumber.substring(phoneNumber.length - 10);

      if (remaining.length === 10) {
        // Format as: +X (XXX) XXX-XXXX
        return `${countryCode} (${remaining.substring(0, 3)}) ${remaining.substring(3, 6)}-${remaining.substring(6)}`;
      }

      return phoneNumber;
    }

    // US/Canada format
    if (phoneNumber.length === 10) {
      return `(${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
    }

    // Default: just return the cleaned number
    return phoneNumber;
  }

  /**
   * Returns the raw phone number value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Returns the formatted phone number
   */
  getFormatted(): string {
    return this.formatted;
  }

  /**
   * Returns the formatted phone number as string
   */
  toString(): string {
    return this.formatted;
  }

  /**
   * Checks equality with another PhoneNumber
   */
  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
