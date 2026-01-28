// ==========================================
// VALIDATION & SANITIZATION UTILITIES
// ==========================================

import { AppError } from '../types';

/**
 * Validates and sanitizes storage path to prevent directory traversal
 * @param path - Path to validate
 * @returns Valid URL or null if invalid
 */
export const validateStoragePath = (
  path: string | undefined,
): string | null => {
  if (!path || typeof path !== 'string') return null;

  // Remove whitespace
  path = path.trim();
  if (!path) return null;

  // Reject absolute paths and directory traversal
  if (path.startsWith('/') || path.includes('..')) return null;

  // Only allow alphanumeric, dots, hyphens, underscores, and forward slashes
  if (!/^[a-zA-Z0-9._\-\/]+$/.test(path)) return null;

  return path;
};

/**
 * Builds complete storage URL with validation
 * @param basePath - Base URL from env
 * @param filePath - File path to validate
 * @returns Complete URL or null if invalid
 */
export const buildStorageUrl = (
  basePath: string,
  filePath: string | undefined,
): string | null => {
  if (!basePath || !filePath) return null;

  const validPath = validateStoragePath(filePath);
  if (!validPath) return null;

  return `${basePath}/storage/${validPath}`;
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * React Native implementation - removes dangerous tags and attributes
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string | undefined): string => {
  if (!html || typeof html !== 'string') return '';

  // Simple HTML sanitization for React Native
  // Removes script tags, event handlers, and dangerous attributes
  let sanitized = html;

  // Remove script tags and content
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );

  // Remove style tags and content
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    '',
  );

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*['"][^'"]*['"]/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove iframe and embed tags
  sanitized = sanitized.replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
  sanitized = sanitized.replace(/<object\b[^>]*>.*?<\/object>/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (for images)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
};

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if valid
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validates phone number format
 * @param phone - Phone to validate
 * @returns True if valid
 */
export const isValidPhone = (phone: string): boolean => {
  const regex = /^(\+62|0)[0-9]{9,12}$/;
  return regex.test(phone.replace(/\D/g, ''));
};

/**
 * Validates file type by MIME type
 * @param mimeType - MIME type to validate
 * @param allowed - Array of allowed MIME types
 * @returns True if valid
 */
export const isValidMimeType = (
  mimeType: string,
  allowed: string[],
): boolean => {
  if (!mimeType) return false;
  return allowed.some(type => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -2));
    }
    return mimeType === type;
  });
};

/**
 * Validates file size
 * @param size - File size in bytes
 * @param maxSizeInMB - Maximum allowed size in MB
 * @returns True if valid
 */
export const isValidFileSize = (
  size: number,
  maxSizeInMB: number = 2,
): boolean => {
  const maxBytes = maxSizeInMB * 1024 * 1024;
  return size > 0 && size <= maxBytes;
};

/**
 * Validates date format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns True if valid
 */
export const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Sanitizes filename to prevent injection attacks
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'file';

  // Remove extension
  const name = filename.split('.')[0];

  // Only allow alphanumeric, spaces, hyphens, underscores
  return (
    name
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .slice(0, 50) // Limit length
      .trim() || 'file'
  );
};

/**
 * Validates form input for common issues
 * @param value - Value to validate
 * @param type - Type of validation (text, email, phone, url, etc)
 * @returns True if valid
 */
export const validateInput = (
  value: string | undefined,
  type: 'text' | 'email' | 'phone' | 'number' | 'date' = 'text',
): boolean => {
  if (!value || typeof value !== 'string') return false;

  value = value.trim();
  if (!value) return false;

  switch (type) {
    case 'email':
      return isValidEmail(value);
    case 'phone':
      return isValidPhone(value);
    case 'number':
      return !isNaN(Number(value));
    case 'date':
      return isValidDateFormat(value);
    default:
      return value.length > 0 && value.length <= 500;
  }
};

/**
 * Validates nested object structure
 * @param obj - Object to validate
 * @param schema - Validation schema
 * @returns Validation result
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

export const validateObject = (
  obj: any,
  schema: ValidationSchema,
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];

    if (
      rules.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors[key] = `${key} is required`;
      continue;
    }

    if (value !== undefined && value !== null && rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors[key] = `${key} must be of type ${rules.type}`;
        continue;
      }
    }

    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[key] = `${key} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[key] = `${key} must be at most ${rules.maxLength} characters`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[key] = `${key} format is invalid`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
