/**
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
        expect(url).toBe(`/api/users?email=${encodeURIComponent(email)}`);
        expect(url).not.toContain('@');
        expect(url).not.toContain('.');
      });
    });
    
    test('buildUrlWithEmail', () => {
      testEmails.forEach(email => {
        const url = SafeUrlBuilder.buildUrlWithEmail('/api/profile', email);
        expect(url).toBe(`/api/profile?email=${encodeURIComponent(email)}`);
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
