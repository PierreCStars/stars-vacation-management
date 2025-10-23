/**
 * 404 Fix for max@stars.mc Email Issue
 * 
 * This file contains the comprehensive fix for the 404 issue that occurs
 * when using max@stars.mc email addresses in the Vacation Management System.
 */

import { SafeUrlBuilder, SafeApiClient } from './url-safety-utils';

/**
 * Fixed API Client for Vacation Management
 * Ensures all API calls with email addresses are safe and won't cause 404 errors
 */
export class VacationApiClient {
  /**
   * Safely fetches vacation requests for a user
   * @param userEmail - User's email address
   * @returns Promise<Response>
   */
  static async fetchUserVacationRequests(userEmail: string): Promise<Response> {
    // ✅ SAFE: Email in query parameter, not in path
    return SafeApiClient.getWithEmail('/api/vacation-requests', userEmail);
  }
  
  /**
   * Safely fetches user profile information
   * @param userEmail - User's email address
   * @returns Promise<Response>
   */
  static async fetchUserProfile(userEmail: string): Promise<Response> {
    // ✅ SAFE: Email in query parameter, not in path
    return SafeApiClient.getWithEmail('/api/user-profile', userEmail);
  }
  
  /**
   * Safely updates user profile
   * @param userEmail - User's email address
   * @param profileData - Profile data to update
   * @returns Promise<Response>
   */
  static async updateUserProfile(userEmail: string, profileData: any): Promise<Response> {
    // ✅ SAFE: Email in request body, not in path
    return SafeApiClient.patchWithEmail('/api/user-profile', userEmail, profileData);
  }
  
  /**
   * Safely fetches user avatar
   * @param userEmail - User's email address
   * @returns Promise<Response>
   */
  static async fetchUserAvatar(userEmail: string): Promise<Response> {
    // ✅ SAFE: Email in query parameter, not in path
    return SafeApiClient.getWithEmail('/api/user-avatar', userEmail);
  }
  
  /**
   * Safely creates a vacation request
   * @param userEmail - User's email address
   * @param vacationData - Vacation request data
   * @returns Promise<Response>
   */
  static async createVacationRequest(userEmail: string, vacationData: any): Promise<Response> {
    // ✅ SAFE: Email in request body, not in path
    return SafeApiClient.postWithEmail('/api/vacation-requests', userEmail, vacationData);
  }
  
  /**
   * Safely fetches admin vacation requests
   * @param adminEmail - Admin's email address
   * @returns Promise<Response>
   */
  static async fetchAdminVacationRequests(adminEmail: string): Promise<Response> {
    // ✅ SAFE: Email in query parameter, not in path
    return SafeApiClient.getWithEmail('/api/admin/vacation-requests', adminEmail);
  }
  
  /**
   * Safely creates admin vacation request
   * @param adminEmail - Admin's email address
   * @param vacationData - Vacation request data
   * @returns Promise<Response>
   */
  static async createAdminVacationRequest(adminEmail: string, vacationData: any): Promise<Response> {
    // ✅ SAFE: Email in request body, not in path
    return SafeApiClient.postWithEmail('/api/admin/vacations', adminEmail, vacationData);
  }
}

/**
 * React Hook for Safe Email API Calls
 * Provides safe methods for making API calls with email addresses in React components
 */
export function useSafeEmailApi() {
  const fetchUserData = async (userEmail: string) => {
    try {
      const response = await VacationApiClient.fetchUserVacationRequests(userEmail);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };
  
  const fetchUserProfile = async (userEmail: string) => {
    try {
      const response = await VacationApiClient.fetchUserProfile(userEmail);
      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };
  
  const updateUserProfile = async (userEmail: string, profileData: any) => {
    try {
      const response = await VacationApiClient.updateUserProfile(userEmail, profileData);
      if (!response.ok) {
        throw new Error(`Failed to update user profile: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };
  
  const fetchUserAvatar = async (userEmail: string) => {
    try {
      const response = await VacationApiClient.fetchUserAvatar(userEmail);
      if (!response.ok) {
        throw new Error(`Failed to fetch user avatar: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      throw error;
    }
  };
  
  return {
    fetchUserData,
    fetchUserProfile,
    updateUserProfile,
    fetchUserAvatar
  };
}

/**
 * Legacy Code Migration Helper
 * Helps identify and fix problematic URL constructions
 */
export class LegacyCodeMigrator {
  /**
   * Scans code for problematic URL patterns
   * @param code - Code to scan
   * @returns Array of problematic patterns found
   */
  static scanForProblematicPatterns(code: string): Array<{
    pattern: string;
    line: number;
    suggestion: string;
  }> {
    const problems: Array<{
      pattern: string;
      line: number;
      suggestion: string;
    }> = [];
    
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      // Check for email in path patterns
      const emailInPathRegex = /\/api\/[^\/]+\/\$\{[^}]*(?:email|userEmail|user\.email)[^}]*\}/;
      if (emailInPathRegex.test(line)) {
        problems.push({
          pattern: line.trim(),
          line: index + 1,
          suggestion: 'Use SafeUrlBuilder.buildUrlWithEmail() or SafeApiClient.getWithEmail() instead'
        });
      }
      
      // Check for direct email concatenation in URLs
      const directEmailRegex = /fetch\([^)]*\+[^)]*(?:email|userEmail|user\.email)[^)]*\)/;
      if (directEmailRegex.test(line)) {
        problems.push({
          pattern: line.trim(),
          line: index + 1,
          suggestion: 'Use SafeApiClient methods instead of direct fetch with email concatenation'
        });
      }
      
      // Check for template literals with email in path
      const templateEmailRegex = /`\/api\/[^`]*\$\{[^}]*(?:email|userEmail|user\.email)[^}]*\}[^`]*`/;
      if (templateEmailRegex.test(line)) {
        problems.push({
          pattern: line.trim(),
          line: index + 1,
          suggestion: 'Use SafeUrlBuilder.buildUrlWithEmail() instead of template literals with email in path'
        });
      }
    });
    
    return problems;
  }
  
  /**
   * Generates migration suggestions for problematic code
   * @param problems - Array of problems found
   * @returns Migration suggestions
   */
  static generateMigrationSuggestions(problems: Array<{
    pattern: string;
    line: number;
    suggestion: string;
  }>): string {
    if (problems.length === 0) {
      return '✅ No problematic patterns found!';
    }
    
    let suggestions = '🔧 Migration Suggestions:\n\n';
    
    problems.forEach((problem, index) => {
      suggestions += `${index + 1}. Line ${problem.line}: ${problem.pattern}\n`;
      suggestions += `   → ${problem.suggestion}\n\n`;
    });
    
    suggestions += '📚 See EMAIL_URL_SAFETY_MIGRATION.md for detailed migration guide.';
    
    return suggestions;
  }
}

// Export all utilities
export { VacationApiClient, useSafeEmailApi, LegacyCodeMigrator };
