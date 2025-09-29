/**
 * Server-side input validation and sanitization service
 */

import { URL } from 'url';

// Security patterns
const MALICIOUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /on\w+\s*=/i,
  /<script/i,
  /eval\(/i,
  /expression\(/i,
  /&#x?[0-9a-f]+;?/i, // HTML entities
  /&[a-z]+;/i // Named entities
];

const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '10.',
  '192.168.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.'
];

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: {
    url: string;
    brief: string;
    metadata: {
      domain: string;
      protocol: string;
      isSecure: boolean;
      briefWordCount: number;
      estimatedReadingTime: number;
    };
  };
}

/**
 * Server-side URL validation with enhanced security checks
 */
function validateUrlServer(url: string): { isValid: boolean; error?: ValidationError; sanitized?: string } {
  const trimmed = url.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: { field: 'url', message: 'URL is required', code: 'URL_REQUIRED' }
    };
  }

  if (trimmed.length > 2048) {
    return {
      isValid: false,
      error: { field: 'url', message: 'URL exceeds maximum length of 2048 characters', code: 'URL_TOO_LONG' }
    };
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: { field: 'url', message: 'URL contains potentially dangerous content', code: 'URL_MALICIOUS' }
      };
    }
  }

  try {
    const urlObj = new URL(trimmed);

    // Protocol validation
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: { field: 'url', message: 'Only HTTP and HTTPS protocols are allowed', code: 'URL_INVALID_PROTOCOL' }
      };
    }

    // Domain validation
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return {
        isValid: false,
        error: { field: 'url', message: 'Invalid or missing domain name', code: 'URL_INVALID_DOMAIN' }
      };
    }

    // Block private/local addresses
    const hostname = urlObj.hostname.toLowerCase();
    for (const blockedDomain of BLOCKED_DOMAINS) {
      if (hostname === blockedDomain || hostname.startsWith(blockedDomain)) {
        return {
          isValid: false,
          error: { field: 'url', message: 'Private or local URLs are not permitted', code: 'URL_PRIVATE_ADDRESS' }
        };
      }
    }

    // Port validation (if specified)
    if (urlObj.port) {
      const port = parseInt(urlObj.port);
      if (port < 1 || port > 65535) {
        return {
          isValid: false,
          error: { field: 'url', message: 'Invalid port number', code: 'URL_INVALID_PORT' }
        };
      }
    }

    // Additional security: Check for suspicious TLDs or patterns
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
    const domain = urlObj.hostname.toLowerCase();
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      // We'll allow but log this for monitoring
      console.warn(`Potentially suspicious TLD detected: ${domain}`);
    }

    return {
      isValid: true,
      sanitized: urlObj.toString()
    };

  } catch (error) {
    return {
      isValid: false,
      error: { field: 'url', message: 'Invalid URL format', code: 'URL_INVALID_FORMAT' }
    };
  }
}

/**
 * Server-side brief validation with enhanced content filtering
 */
function validateBriefServer(brief: string): { isValid: boolean; error?: ValidationError; sanitized?: string } {
  const trimmed = brief.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: { field: 'brief', message: 'Brief description is required', code: 'BRIEF_REQUIRED' }
    };
  }

  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: { field: 'brief', message: 'Brief description must be at least 10 characters', code: 'BRIEF_TOO_SHORT' }
    };
  }

  if (trimmed.length > 1000) {
    return {
      isValid: false,
      error: { field: 'brief', message: 'Brief description exceeds maximum length of 1000 characters', code: 'BRIEF_TOO_LONG' }
    };
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: { field: 'brief', message: 'Brief contains potentially dangerous content', code: 'BRIEF_MALICIOUS' }
      };
    }
  }

  // Check for HTML tags
  if (/<[^>]*>/i.test(trimmed)) {
    return {
      isValid: false,
      error: { field: 'brief', message: 'HTML tags are not allowed', code: 'BRIEF_HTML_DETECTED' }
    };
  }

  // Advanced content filtering
  const suspiciousPatterns = [
    /\b(credit|card|password|ssn|social\s+security)\b/i,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card patterns
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email patterns
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: { field: 'brief', message: 'Brief contains sensitive information that should not be included', code: 'BRIEF_SENSITIVE_DATA' }
      };
    }
  }

  // Sanitize content
  let sanitized = trimmed
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;') // Escape unescaped ampersands
    .trim();

  // Check length after sanitization
  if (sanitized.length < 10) {
    return {
      isValid: false,
      error: { field: 'brief', message: 'Brief description too short after content filtering', code: 'BRIEF_INSUFFICIENT_CONTENT' }
    };
  }

  return {
    isValid: true,
    sanitized
  };
}

/**
 * Main validation service for ICP inputs
 */
export class IcpValidationService {
  /**
   * Validates and sanitizes ICP inputs
   */
  static validateIcpInputs(url: string, brief: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate URL
    const urlValidation = validateUrlServer(url);
    if (!urlValidation.isValid) {
      errors.push(urlValidation.error!);
    }

    // Validate brief
    const briefValidation = validateBriefServer(brief);
    if (!briefValidation.isValid) {
      errors.push(briefValidation.error!);
    }

    // If either failed, return errors
    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    // Both validations passed, create sanitized data with metadata
    const urlObj = new URL(urlValidation.sanitized!);
    const wordCount = briefValidation.sanitized!.split(/\s+/).length;
    const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute

    return {
      isValid: true,
      errors: [],
      sanitizedData: {
        url: urlValidation.sanitized!,
        brief: briefValidation.sanitized!,
        metadata: {
          domain: urlObj.hostname,
          protocol: urlObj.protocol,
          isSecure: urlObj.protocol === 'https:',
          briefWordCount: wordCount,
          estimatedReadingTime
        }
      }
    };
  }

  /**
   * Additional business logic validation
   */
  static validateBusinessContext(url: string, brief: string): ValidationResult {
    const basicValidation = this.validateIcpInputs(url, brief);

    if (!basicValidation.isValid) {
      return basicValidation;
    }

    const { sanitizedData } = basicValidation;
    const domain = sanitizedData!.metadata.domain.toLowerCase();
    const briefLower = sanitizedData!.brief.toLowerCase();

    // Extract company name from domain for relevance checking
    const domainParts = domain.split('.');
    const companyName = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domain;

    // Check for basic relevance (soft validation - warning only)
    const relevanceIndicators = [
      briefLower.includes(companyName),
      briefLower.includes(domain),
      briefLower.includes('company'),
      briefLower.includes('business'),
      briefLower.includes('service'),
      briefLower.includes('product')
    ];

    const relevanceScore = relevanceIndicators.filter(Boolean).length;

    // Add relevance metadata
    const enhancedMetadata = {
      ...sanitizedData!.metadata,
      relevanceScore,
      companyName,
      hasBusinessContext: relevanceScore >= 2
    };

    return {
      isValid: true,
      errors: [],
      sanitizedData: {
        ...sanitizedData!,
        metadata: enhancedMetadata
      }
    };
  }
}

/**
 * Rate limiting service for API protection
 */
export class ValidationRateLimit {
  private static attempts = new Map<string, number[]>();
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly WINDOW_MS = 60000; // 1 minute

  static canProceed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Clean old attempts
    const recentAttempts = attempts.filter(time => now - time < this.WINDOW_MS);
    this.attempts.set(identifier, recentAttempts);

    return recentAttempts.length < this.MAX_ATTEMPTS;
  }

  static recordAttempt(identifier: string): void {
    const attempts = this.attempts.get(identifier) || [];
    attempts.push(Date.now());
    this.attempts.set(identifier, attempts);
  }

  static getRemainingAttempts(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < this.WINDOW_MS);
    return Math.max(0, this.MAX_ATTEMPTS - recentAttempts.length);
  }
}