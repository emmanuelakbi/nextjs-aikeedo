import { randomUUID } from 'crypto';

/**
 * Id Value Object
 *
 * Represents a unique identifier using UUID v4.
 * Immutable value object for entity identification.
 */

export class Id {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Generates a new UUID v4
   */
  static generate(): Id {
    return new Id(randomUUID());
  }

  /**
   * Creates an Id from an existing UUID string
   * @throws Error if UUID format is invalid
   */
  static fromString(uuid: string): Id {
    if (!uuid) {
      throw new Error('UUID cannot be empty');
    }

    // UUID v4 format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      throw new Error('Invalid UUID format');
    }

    return new Id(uuid.toLowerCase());
  }

  /**
   * Returns the UUID as a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the raw UUID value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Checks equality with another Id
   */
  equals(other: Id): boolean {
    return this.value === other.value;
  }
}
