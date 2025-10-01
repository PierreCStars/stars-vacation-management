/**
 * Unit test to prevent test fixtures from being used in production
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const TEST_NAMES = ['John Smith', 'Mike Wilson', 'Jane Doe'];
const EXCLUDED_PATHS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '__tests__',
  'test-',
  'cleanup_test_users.ts',
  'import-firebase-data.cjs',
  'scripts/cleanup_test_users.ts'
];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!EXCLUDED_PATHS.some(excluded => fullPath.includes(excluded))) {
        getAllFiles(fullPath, fileList);
      }
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
      if (!EXCLUDED_PATHS.some(excluded => fullPath.includes(excluded))) {
        fileList.push(fullPath);
      }
    }
  }
  
  return fileList;
}

function checkFileForTestNames(filePath: string): { found: boolean; matches: string[] } {
  try {
    const content = readFileSync(filePath, 'utf8');
    const matches: string[] = [];
    
    for (const name of TEST_NAMES) {
      if (content.includes(name)) {
        matches.push(name);
      }
    }
    
    return {
      found: matches.length > 0,
      matches
    };
  } catch (error) {
    return { found: false, matches: [] };
  }
}

describe('No Test Fixtures', () => {
  it('should not contain test user names in source code', () => {
    const projectRoot = join(__dirname, '../../../../');
    const allFiles = getAllFiles(projectRoot);
    const violations: { file: string; matches: string[] }[] = [];
    
    for (const file of allFiles) {
      const result = checkFileForTestNames(file);
      if (result.found) {
        violations.push({
          file: file.replace(projectRoot, ''),
          matches: result.matches
        });
      }
    }
    
    if (violations.length > 0) {
      console.error('❌ Found test user names in source code:');
      violations.forEach(violation => {
        console.error(`  ${violation.file}: ${violation.matches.join(', ')}`);
      });
    }
    
    expect(violations).toHaveLength(0);
  });
  
  it('should not contain mock data patterns in analytics code', () => {
    const analyticsFiles = [
      'src/app/api/analytics/vacations/route.ts',
      'src/app/api/analytics/vacations.csv/route.ts',
      'src/lib/analytics/data.ts'
    ];
    
    const mockPatterns = [
      'mock-',
      'fixture',
      'sampleData',
      'dummy',
      'test data'
    ];
    
    const violations: { file: string; patterns: string[] }[] = [];
    
    for (const file of analyticsFiles) {
      try {
        const content = readFileSync(join(__dirname, '../../../../', file), 'utf8');
        const foundPatterns: string[] = [];
        
        for (const pattern of mockPatterns) {
          if (content.toLowerCase().includes(pattern.toLowerCase())) {
            foundPatterns.push(pattern);
          }
        }
        
        if (foundPatterns.length > 0) {
          violations.push({
            file,
            patterns: foundPatterns
          });
        }
      } catch (error) {
        // File might not exist, skip
      }
    }
    
    if (violations.length > 0) {
      console.error('❌ Found mock data patterns in analytics code:');
      violations.forEach(violation => {
        console.error(`  ${violation.file}: ${violation.patterns.join(', ')}`);
      });
    }
    
    expect(violations).toHaveLength(0);
  });
});
