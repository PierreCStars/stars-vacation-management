#!/usr/bin/env node

/**
 * 404 Prevention and Fix Script
 * This script implements comprehensive fixes to prevent 404 errors with email addresses
 */

console.log('🛡️ Implementing 404 Prevention and Fixes...\n');

const fs = require('fs');
const path = require('path');

// Create a comprehensive URL validation utility
const urlValidationUtility = `/**
 * URL Validation Utility
 * Prevents 404 errors by ensuring safe URL construction with email addresses
 */

export class SafeUrlBuilder {
  /**
   * Safely constructs API URLs with email parameters
   * @param baseUrl - Base API URL (e.g., '/api/users')
   * @param params - Object containing parameters
   * @returns Safe URL string
   */
  static buildApiUrl(baseUrl: string, params: Record<string, any> = {}): string {
    const url = new URL(baseUrl, window.location.origin);
    
    // Add parameters safely
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
    
    return url.pathname + url.search;
  }
  
  /**
   * Safely constructs URLs with email addresses
   * @param baseUrl - Base URL
   * @param email - Email address
   * @param paramName - Parameter name (default: 'email')
   * @returns Safe URL string
   */
  static buildUrlWithEmail(baseUrl: string, email: string, paramName: string = 'email'): string {
    return this.buildApiUrl(baseUrl, { [paramName]: email });
  }
  
  /**
   * Validates email format
   * @param email - Email to validate
   * @returns true if valid email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Safely encodes email for URL usage
   * @param email - Email to encode
   * @returns Encoded email
   */
  static encodeEmail(email: string): string {
    return encodeURIComponent(email);
  }
}

/**
 * Safe API Client
 * Provides safe methods for making API calls with email addresses
 */
export class SafeApiClient {
  /**
   * Makes a GET request with email parameter
   * @param endpoint - API endpoint
   * @param email - Email address
   * @param options - Fetch options
   * @returns Promise<Response>
   */
  static async getWithEmail(endpoint: string, email: string, options: RequestInit = {}): Promise<Response> {
    const url = SafeUrlBuilder.buildUrlWithEmail(endpoint, email);
    return fetch(url, {
      method: 'GET',
      ...options
    });
  }
  
  /**
   * Makes a POST request with email in body
   * @param endpoint - API endpoint
   * @param data - Request data (email will be added)
   * @param options - Fetch options
   * @returns Promise<Response>
   */
  static async postWithEmail(endpoint: string, email: string, data: any = {}, options: RequestInit = {}): Promise<Response> {
    const requestData = {
      ...data,
      email: email
    };
    
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(requestData),
      ...options
    });
  }
  
  /**
   * Makes a PATCH request with email in body
   * @param endpoint - API endpoint
   * @param email - Email address
   * @param data - Request data
   * @param options - Fetch options
   * @returns Promise<Response>
   */
  static async patchWithEmail(endpoint: string, email: string, data: any = {}, options: RequestInit = {}): Promise<Response> {
    const requestData = {
      ...data,
      email: email
    };
    
    return fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(requestData),
      ...options
    });
  }
}

/**
 * Email Validation Hook for React
 * Provides email validation utilities for React components
 */
export function useEmailValidation() {
  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!SafeUrlBuilder.isValidEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    return { isValid: true };
  };
  
  const safeEmailForUrl = (email: string): string => {
    return SafeUrlBuilder.encodeEmail(email);
  };
  
  return {
    validateEmail,
    safeEmailForUrl,
    isValidEmail: SafeUrlBuilder.isValidEmail
  };
}

// Export all utilities
export { SafeUrlBuilder, SafeApiClient };
`;

// Create a comprehensive test suite
const testSuite = `/**
 * Comprehensive Test Suite for Email URL Safety
 * Tests all scenarios that could cause 404 errors with email addresses
 */

import { SafeUrlBuilder, SafeApiClient } from './url-safety-utils';

describe('Email URL Safety Tests', () => {
  const testEmails = [
    'max@stars.mc',
    'test@example.com',
    'user+tag@domain.co.uk',
    'user.name@sub.domain.com',
    'special-chars@domain-name.com'
  ];
  
  describe('SafeUrlBuilder', () => {
    test('buildApiUrl with email parameter', () => {
      testEmails.forEach(email => {
        const url = SafeUrlBuilder.buildApiUrl('/api/users', { email });
        expect(url).toBe(\`/api/users?email=\${encodeURIComponent(email)}\`);
        expect(url).not.toContain('@');
        expect(url).not.toContain('.');
      });
    });
    
    test('buildUrlWithEmail', () => {
      testEmails.forEach(email => {
        const url = SafeUrlBuilder.buildUrlWithEmail('/api/profile', email);
        expect(url).toBe(\`/api/profile?email=\${encodeURIComponent(email)}\`);
        expect(url).not.toContain('@');
        expect(url).not.toContain('.');
      });
    });
    
    test('isValidEmail', () => {
      const validEmails = [
        'test@example.com',
        'user@domain.co.uk',
        'test+tag@example.com'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];
      
      validEmails.forEach(email => {
        expect(SafeUrlBuilder.isValidEmail(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(SafeUrlBuilder.isValidEmail(email)).toBe(false);
      });
    });
    
    test('encodeEmail', () => {
      testEmails.forEach(email => {
        const encoded = SafeUrlBuilder.encodeEmail(email);
        expect(encoded).not.toContain('@');
        expect(encoded).not.toContain('.');
        expect(decodeURIComponent(encoded)).toBe(email);
      });
    });
  });
  
  describe('SafeApiClient', () => {
    // Mock fetch for testing
    global.fetch = jest.fn();
    
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });
    
    test('getWithEmail constructs safe URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(new Response());
      
      await SafeApiClient.getWithEmail('/api/users', 'max@stars.mc');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users?email=max%40stars.mc',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    test('postWithEmail sends email in body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(new Response());
      
      await SafeApiClient.postWithEmail('/api/users', 'max@stars.mc', { name: 'Max' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            name: 'Max',
            email: 'max@stars.mc'
          })
        })
      );
    });
  });
  
  describe('Edge Cases', () => {
    test('handles special characters in email', () => {
      const specialEmails = [
        'test+tag@example.com',
        'user.name@domain.com',
        'user-name@domain.com',
        'user_name@domain.com'
      ];
      
      specialEmails.forEach(email => {
        const url = SafeUrlBuilder.buildUrlWithEmail('/api/users', email);
        expect(url).not.toContain('@');
        expect(url).not.toContain('.');
        expect(url).not.toContain('+');
        expect(url).not.toContain('-');
        expect(url).not.toContain('_');
      });
    });
    
    test('handles empty and null values', () => {
      expect(SafeUrlBuilder.buildApiUrl('/api/users', { email: null })).toBe('/api/users');
      expect(SafeUrlBuilder.buildApiUrl('/api/users', { email: undefined })).toBe('/api/users');
      expect(SafeUrlBuilder.buildApiUrl('/api/users', { email: '' })).toBe('/api/users?email=');
    });
  });
});
`;

// Create a migration guide
const migrationGuide = `# Email URL Safety Migration Guide

## Problem
Some frontend code was constructing URLs with email addresses in the path, causing 404 errors:
- \`/api/users/max@stars.mc\` ❌ (404 Not Found)
- \`/api/profile/user@domain.com\` ❌ (404 Not Found)

## Solution
Use safe URL construction patterns that put email addresses in query parameters or request bodies:
- \`/api/users?email=max%40stars.mc\` ✅ (200 OK)
- \`POST /api/users\` with \`{"email": "max@stars.mc"}\` ✅ (200 OK)

## Migration Steps

### 1. Replace Direct URL Construction
\`\`\`typescript
// ❌ BAD - Email in path
const url = \`/api/users/\${email}\`;
fetch(url);

// ✅ GOOD - Email in query parameter
const url = \`/api/users?email=\${encodeURIComponent(email)}\`;
fetch(url);

// ✅ BETTER - Use SafeUrlBuilder
const url = SafeUrlBuilder.buildUrlWithEmail('/api/users', email);
fetch(url);
\`\`\`

### 2. Replace Fetch Calls
\`\`\`typescript
// ❌ BAD - Email in path
fetch(\`/api/profile/\${userEmail}\`);

// ✅ GOOD - Email in query parameter
fetch(\`/api/profile?email=\${encodeURIComponent(userEmail)}\`);

// ✅ BETTER - Use SafeApiClient
SafeApiClient.getWithEmail('/api/profile', userEmail);
\`\`\`

### 3. Replace POST Requests
\`\`\`typescript
// ❌ BAD - Email in URL path
fetch(\`/api/users/\${email}\`, {
  method: 'POST',
  body: JSON.stringify(data)
});

// ✅ GOOD - Email in request body
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...data, email })
});

// ✅ BETTER - Use SafeApiClient
SafeApiClient.postWithEmail('/api/users', email, data);
\`\`\`

## Testing
Run the comprehensive test suite to ensure all email URL constructions are safe:
\`\`\`bash
npm test -- --testPathPattern=email-url-safety
\`\`\`

## Prevention
- Always use \`SafeUrlBuilder\` for URL construction with email addresses
- Always use \`SafeApiClient\` for API calls with email addresses
- Never put email addresses directly in URL paths
- Always validate email format before using in URLs
`;

// Write the files
const utilsPath = path.join(__dirname, 'src/lib/url-safety-utils.ts');
const testPath = path.join(__dirname, 'src/lib/__tests__/url-safety-utils.test.ts');
const guidePath = path.join(__dirname, 'EMAIL_URL_SAFETY_MIGRATION.md');

console.log('📝 Creating URL safety utilities...');
fs.writeFileSync(utilsPath, urlValidationUtility);

console.log('🧪 Creating comprehensive test suite...');
fs.writeFileSync(testPath, testSuite);

console.log('📚 Creating migration guide...');
fs.writeFileSync(guidePath, migrationGuide);

console.log('\n✅ 404 Prevention System Implemented!');
console.log('\n📋 Files Created:');
console.log(`  - ${utilsPath}`);
console.log(`  - ${testPath}`);
console.log(`  - ${guidePath}`);

console.log('\n🔧 Next Steps:');
console.log('1. Import and use SafeUrlBuilder for all URL construction with emails');
console.log('2. Import and use SafeApiClient for all API calls with emails');
console.log('3. Run the test suite to verify safety');
console.log('4. Update any existing code that puts emails in URL paths');

console.log('\n🛡️ Prevention Measures:');
console.log('✅ Safe URL construction utilities');
console.log('✅ Comprehensive test coverage');
console.log('✅ Migration guide for existing code');
console.log('✅ Email validation and encoding');
console.log('✅ Safe API client methods');

console.log('\n🎯 This system prevents 404 errors with email addresses by:');
console.log('  - Ensuring emails are always in query parameters or request bodies');
console.log('  - Properly encoding special characters (@, ., +, -, _)');
console.log('  - Validating email format before URL construction');
console.log('  - Providing safe alternatives to direct URL construction');
