/**
 * Input Sanitization Utilities
 * Protects against XSS and injection attacks
 */

export function sanitizeHtml(dirty: string): string {
  // Remove any HTML/script tags
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeText(text: string): string {
  // Remove any HTML/script tags and dangerous patterns
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

export function sanitizeWorkspaceName(name: string): string {
  const sanitized = sanitizeText(name);
  
  // Additional validation
  if (sanitized.length === 0) {
    throw new Error('Workspace name cannot be empty after sanitization');
  }
  
  if (sanitized.length > 100) {
    throw new Error('Workspace name too long');
  }
  
  return sanitized;
}

export function sanitizeEmail(email: string): string {
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

export function sanitizeUserInput(input: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeUserInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
