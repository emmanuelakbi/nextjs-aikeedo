/**
 * Password Value Object
 *
 * Represents a password with strength validation.
 * Immutable value object that ensures password meets security requirements.
 */

export class Password {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a Password value object from a plain text password
   * @throws Error if password doesn't meet strength requirements
   */
  static create(password: string): Password {
    if (!password) {
      throw new Error('Password cannot be empty');
    }

    // Minimum length requirement
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Maximum length for security (bcrypt has 72 byte limit)
    if (password.length > 72) {
      throw new Error('Password must not exceed 72 characters');
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    const strengthCriteriaMet = [
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (strengthCriteriaMet < 3) {
      throw new Error(
        'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character'
      );
    }

    // Check for common weak patterns
    if (/^(.)\1+$/.test(password)) {
      throw new Error('Password cannot be all the same character');
    }

    if (
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
        password
      )
    ) {
      throw new Error('Password contains sequential characters');
    }

    return new Password(password);
  }

  /**
   * Returns the password value (use with caution)
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Returns the length of the password
   */
  getLength(): number {
    return this.value.length;
  }

  /**
   * Checks if password contains uppercase letters
   */
  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.value);
  }

  /**
   * Checks if password contains lowercase letters
   */
  hasLowerCase(): boolean {
    return /[a-z]/.test(this.value);
  }

  /**
   * Checks if password contains numbers
   */
  hasNumber(): boolean {
    return /[0-9]/.test(this.value);
  }

  /**
   * Checks if password contains special characters
   */
  hasSpecialChar(): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.value);
  }
}
