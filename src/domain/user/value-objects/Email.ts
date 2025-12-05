/**
 * Email Value Object
 *
 * Represents a validated email address.
 * Immutable value object that ensures email format correctness.
 */

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates an Email value object from a string
   * @throws Error if email format is invalid
   */
  static create(email: string): Email {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      throw new Error('Email cannot be empty');
    }

    // RFC 5322 compliant email validation
    const emailRegex =
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

    if (!emailRegex.test(trimmed)) {
      throw new Error('Invalid email format');
    }

    // Additional validation rules
    if (trimmed.length > 254) {
      throw new Error('Email address is too long (max 254 characters)');
    }

    const [localPart, domain] = trimmed.split('@');

    if (!localPart || localPart.length > 64) {
      throw new Error('Email local part is too long (max 64 characters)');
    }

    if (!domain || domain.length > 253) {
      throw new Error('Email domain is too long (max 253 characters)');
    }

    return new Email(trimmed);
  }

  /**
   * Returns the email address as a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks equality with another Email
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the raw email value
   */
  getValue(): string {
    return this.value;
  }
}
