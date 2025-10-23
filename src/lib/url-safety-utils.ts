/**
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
// SafeUrlBuilder and SafeApiClient are already exported above as classes
