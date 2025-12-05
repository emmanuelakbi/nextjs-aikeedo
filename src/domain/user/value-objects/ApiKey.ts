import { randomBytes, createHash } from 'crypto';

/**
 * ApiKey Value Object
 *
 * Represents an API key with secure generation and hashing.
 * Immutable value object for API authentication.
 */

export class ApiKey {
  private readonly value: string;
  private readonly hash: string;

  private constructor(value: string, hash: string) {
    this.value = value;
    this.hash = hash;
  }

  /**
   * Generates a new API key
   * Format: ak_live_<32 random hex characters>
   */
  static generate(): ApiKey {
    const randomPart = randomBytes(16).toString('hex');
    const apiKey = `ak_live_${randomPart}`;
    const hash = ApiKey.hashKey(apiKey);

    return new ApiKey(apiKey, hash);
  }

  /**
   * Creates an ApiKey from an existing key string
   * @throws Error if API key format is invalid
   */
  static fromString(apiKey: string): ApiKey {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }

    if (!apiKey.startsWith('ak_live_') && !apiKey.startsWith('ak_test_')) {
      throw new Error(
        'Invalid API key format: must start with ak_live_ or ak_test_'
      );
    }

    const keyPart = apiKey.substring(8); // Remove prefix

    if (keyPart.length !== 32) {
      throw new Error('Invalid API key format: key part must be 32 characters');
    }

    if (!/^[a-f0-9]{32}$/.test(keyPart)) {
      throw new Error('Invalid API key format: key part must be hexadecimal');
    }

    const hash = ApiKey.hashKey(apiKey);

    return new ApiKey(apiKey, hash);
  }

  /**
   * Creates an ApiKey from a stored hash (for verification)
   */
  static fromHash(hash: string): ApiKey {
    if (!hash) {
      throw new Error('API key hash cannot be empty');
    }

    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error('Invalid API key hash format');
    }

    // We don't have the original key, so we store empty string
    return new ApiKey('', hash);
  }

  /**
   * Hashes an API key using SHA-256
   */
  private static hashKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Returns the plain API key value (use with caution - only for initial display)
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Returns the hashed API key (for storage)
   */
  getHash(): string {
    return this.hash;
  }

  /**
   * Verifies if a given API key matches this hash
   */
  verify(apiKey: string): boolean {
    const hash = ApiKey.hashKey(apiKey);
    return hash === this.hash;
  }

  /**
   * Returns a masked version of the API key for display
   */
  getMasked(): string {
    if (!this.value) {
      return 'ak_****...****';
    }

    const prefix = this.value.substring(0, 8);
    const suffix = this.value.substring(this.value.length - 4);
    return `${prefix}...${suffix}`;
  }

  /**
   * Checks if this is a test key
   */
  isTestKey(): boolean {
    return this.value.startsWith('ak_test_');
  }

  /**
   * Checks if this is a live key
   */
  isLiveKey(): boolean {
    return this.value.startsWith('ak_live_');
  }
}
