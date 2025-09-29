/**
 * Input validation and sanitization utilities
 */

// URL validation patterns
const URL_PATTERNS = {
  BASIC: /^https?:\/\/.+\..+/i,
  STRICT: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/,
  DOMAIN: /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/
};

// Common malicious patterns to block
const MALICIOUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /on\w+\s*=/i,
  /<script/i,
  /eval\(/i,
  /expression\(/i
];

// Safe domain patterns (we'll be permissive but secure)
const UNSAFE_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'file://',
  'ftp://'
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates and sanitizes URL input
 */
export function validateUrl(url: string): ValidationResult {
  // Basic sanitization - trim and remove dangerous characters
  let trimmed = url.trim();

  if (!trimmed) {
    return { isValid: false, error: 'URL is required' };
  }

  if (trimmed.length > 2048) {
    return { isValid: false, error: 'URL is too long (max 2048 characters)' };
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isValid: false, error: 'URL contains invalid characters or patterns' };
    }
  }

  // If user omitted protocol, assume https
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  // Basic URL format validation
  if (!URL_PATTERNS.DOMAIN.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
  }

  // Check for unsafe domains in development/demo mode
  const lowercaseUrl = trimmed.toLowerCase();
  for (const unsafeDomain of UNSAFE_DOMAINS) {
    if (lowercaseUrl.includes(unsafeDomain)) {
      return { isValid: false, error: 'Local or unsafe URLs are not permitted' };
    }
  }

  // Additional URL validation using browser URL constructor
  try {
    const urlObj = new URL(trimmed);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Ensure domain has valid format
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { isValid: false, error: 'Invalid domain name' };
    }

    return {
      isValid: true,
      sanitized: urlObj.toString() // This normalizes the URL
    };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validates and sanitizes brief description input
 */
export function validateBrief(brief: string, required: boolean = false): ValidationResult {
  // Basic sanitization
  const trimmed = brief.trim();

  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Brief description is required' };
    } else {
      return { isValid: true, sanitized: '' };
    }
  }

  if (trimmed.length < 10) {
    return { isValid: false, error: 'Brief description must be at least 10 characters' };
  }

  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Brief description is too long (max 1000 characters)' };
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isValid: false, error: 'Brief contains invalid characters or patterns' };
    }
  }

  // Basic HTML/script tag detection
  if (/<[^>]*>/i.test(trimmed)) {
    return { isValid: false, error: 'HTML tags are not allowed in brief description' };
  }

  // Sanitize by removing potentially dangerous characters while preserving readability
  const sanitized = trimmed
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  if (sanitized.length < 10) {
    return { isValid: false, error: 'Brief description too short after sanitization' };
  }

  return {
    isValid: true,
    sanitized: sanitized
  };
}

/**
 * Validates both URL and brief together for business logic rules
 */
export function validateIcpInputs(url: string, brief: string): ValidationResult {
  const urlValidation = validateUrl(url);
  if (!urlValidation.isValid) {
    return urlValidation;
  }

  const briefValidation = validateBrief(brief);
  if (!briefValidation.isValid) {
    return briefValidation;
  }

  // Additional business logic validation
  const urlObj = new URL(urlValidation.sanitized!);
  const domain = urlObj.hostname.toLowerCase();

  // Check if brief mentions the domain (basic relevance check)
  const briefLower = briefValidation.sanitized!.toLowerCase();
  const domainParts = domain.split('.');
  const mainDomain = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domain;

  // This is a soft validation - we won't fail but will note it
  const isDomainMentioned = briefLower.includes(mainDomain) || briefLower.includes(domain);

  return {
    isValid: true,
    sanitized: JSON.stringify({
      url: urlValidation.sanitized,
      brief: briefValidation.sanitized,
      meta: {
        domain,
        domainMentioned: isDomainMentioned
      }
    })
  };
}

/**
 * Rate limiting helper for validation requests
 */
export class ValidationRateLimit {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canValidate(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);

    this.attempts.set(identifier, recentAttempts);

    return recentAttempts.length < this.maxAttempts;
  }

  recordAttempt(identifier: string): void {
    const attempts = this.attempts.get(identifier) || [];
    attempts.push(Date.now());
    this.attempts.set(identifier, attempts);
  }
}
