/**
 * Property-Based Testing Helpers
 *
 * Utilities and generators for property-based testing with fast-check
 */

import * as fc from 'fast-check';

/**
 * Generate a valid email address
 */
export const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]+$/),
    fc.stringMatching(/^[a-z0-9]+$/),
    fc.constantFrom('com', 'org', 'net', 'io', 'dev')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generate a valid password (8-100 characters, with at least one uppercase, lowercase, and number)
 */
export const passwordArbitrary = fc
  .tuple(
    fc.stringMatching(/^[A-Z][a-z0-9]{2,30}$/), // Start with uppercase
    fc.stringMatching(/^[0-9]{1,5}$/), // Some numbers
    fc.stringMatching(/^[a-z]{2,30}$/), // Some lowercase
    fc
      .constantFrom('!', '@', '#', '$', '%', '^', '&', '*')
      .map((s) => fc.constant(s))
      .chain((x) => x)
  )
  .map(
    ([upper, numbers, lower, special]) => `${upper}${numbers}${lower}${special}`
  )
  .filter((pwd) => pwd.length >= 8 && pwd.length <= 100);

/**
 * Generate a weak password (for testing validation)
 */
export const weakPasswordArbitrary = fc.oneof(
  fc.constant(''), // Empty
  fc.constant('123'), // Too short
  fc.constant('password'), // No uppercase or numbers
  fc.constant('PASSWORD'), // No lowercase or numbers
  fc.constant('12345678'), // No letters
  fc.stringMatching(/^[a-z]{1,7}$/) // Too short and weak
);

/**
 * Generate a valid first or last name
 */
export const nameArbitrary = fc
  .stringMatching(/^[A-Z][a-z]{1,30}$/)
  .filter((name) => name.length >= 2 && name.length <= 50);

/**
 * Generate a valid phone number (E.164 format)
 */
export const phoneNumberArbitrary = fc
  .tuple(
    fc.constantFrom('1', '44', '49', '33', '81', '86'), // Country codes
    fc.stringMatching(/^[0-9]{7,12}$/) // Phone number
  )
  .map(([country, number]) => `+${country}${number}`);

/**
 * Generate a valid UUID v4
 */
export const uuidArbitrary = fc.uuid();

/**
 * Generate a valid workspace name
 */
export const workspaceNameArbitrary = fc
  .stringMatching(/^[A-Za-z0-9 ]{3,50}$/)
  .filter((name) => name.trim().length >= 3);

/**
 * Generate a positive integer for credit counts
 */
export const creditCountArbitrary = fc.integer({ min: 0, max: 1000000 });

/**
 * Generate a valid session token
 */
export const sessionTokenArbitrary = fc.stringMatching(/^[a-zA-Z0-9]{32,128}$/);

/**
 * Generate a future date (for expiration testing)
 */
export const futureDateArbitrary = fc
  .integer({ min: 1, max: 365 * 2 }) // 1 day to 2 years in the future
  .map((days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000));

/**
 * Generate a past date (for expiration testing)
 */
export const pastDateArbitrary = fc
  .integer({ min: 1, max: 365 * 2 }) // 1 day to 2 years in the past
  .map((days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000));

/**
 * Generate a verification token
 */
export const verificationTokenArbitrary =
  fc.stringMatching(/^[a-zA-Z0-9]{32,64}$/);

/**
 * Generate SQL injection attempt strings (for security testing)
 */
export const sqlInjectionArbitrary = fc.constantFrom(
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  '1; DELETE FROM users WHERE 1=1',
  "' UNION SELECT * FROM users--"
);

/**
 * Generate XSS attempt strings (for security testing)
 */
export const xssArbitrary = fc.constantFrom(
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>'
);

/**
 * Run a property test with the standard configuration (100 iterations minimum)
 */
export function runPropertyTest<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options: fc.Parameters<[T]> = {}
): Promise<void> {
  return fc.assert(
    fc.asyncProperty(arbitrary, async (value) => {
      const result = await predicate(value);
      return result;
    }),
    {
      numRuns: 100, // Minimum 100 iterations as per design doc
      ...options,
    }
  );
}
