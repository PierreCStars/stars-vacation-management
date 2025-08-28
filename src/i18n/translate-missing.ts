/**
 * Auto-translation helper for filling missing translation keys
 * Run this once to populate missing French and Italian translations
 * 
 * Usage: npm run translate-missing
 * 
 * Requires environment variables:
 * - OPENAI_API_KEY (for ChatGPT translations)
 * - DEEPL_API_KEY (optional, for DeepL translations)
 * - TARGET_LANGS=fr,it (comma-separated target languages)
 */

import fs from 'fs';
import path from 'path';
import { safeTrim } from '@/lib/strings';

interface TranslationData {
  [key: string]: any;
}

const LOCALES_DIR = path.join(process.cwd(), 'src', 'locales');
const SOURCE_LOCALE = 'en';

async function translateText(text: string, targetLang: string, apiKey: string): Promise<string> {
  try {
    // Try OpenAI first (ChatGPT)
    if (apiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${targetLang === 'fr' ? 'French' : 'Italian'}. 
                       Only return the translation, nothing else. Keep the same tone and style.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return safeTrim(data.choices[0]?.message?.content, text);
      }
    }

    // Fallback: return original text
    console.log(`⚠️  Could not translate "${text}" to ${targetLang}`);
    return text;
  } catch (error) {
    console.error(`❌ Translation error for "${text}":`, error);
    return text;
  }
}

function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string[], value: any): void {
  const lastKey = path.pop()!;
  const target = path.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

async function translateMissingKeys(
  sourceData: TranslationData,
  targetData: TranslationData,
  targetLang: string,
  apiKey: string
): Promise<TranslationData> {
  const result = { ...targetData };
  const missingKeys: string[] = [];

  function findMissingKeys(obj: any, path: string[] = []): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];
      const targetValue = getNestedValue(result, currentPath);
      
      if (typeof value === 'string') {
        if (!targetValue || targetValue === value) {
          missingKeys.push(currentPath.join('.'));
        }
      } else if (typeof value === 'object' && value !== null) {
        findMissingKeys(value, currentPath);
      }
    }
  }

  findMissingKeys(sourceData);

  if (missingKeys.length === 0) {
    console.log(`✅ All keys already translated for ${targetLang}`);
    return result;
  }

  console.log(`🔍 Found ${missingKeys.length} missing keys for ${targetLang}`);

  // Translate missing keys
  for (const keyPath of missingKeys) {
    const sourceValue = getNestedValue(sourceData, keyPath.split('.'));
    if (typeof sourceValue === 'string') {
      console.log(`🔄 Translating: ${keyPath} = "${sourceValue}"`);
      const translated = await translateText(sourceValue, targetLang, apiKey);
      setNestedValue(result, keyPath.split('.'), translated);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return result;
}

function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sorted: any = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  
  return sorted;
}

async function main() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const targetLangs = process.env.TARGET_LANGS?.split(',') || ['fr', 'it'];

    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    console.log('🚀 Starting auto-translation...');
    console.log(`📚 Source locale: ${SOURCE_LOCALE}`);
    console.log(`🎯 Target locales: ${targetLangs.join(', ')}`);

    // Load source translations
    const sourcePath = path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`);
    const sourceData: TranslationData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

    // Process each target language
    for (const targetLang of targetLangs) {
      const targetPath = path.join(LOCALES_DIR, `${targetLang}.json`);
      
      if (!fs.existsSync(targetPath)) {
        console.error(`❌ Target file not found: ${targetPath}`);
        continue;
      }

      console.log(`\n🌍 Processing ${targetLang}...`);
      
      // Load existing target translations
      const targetData: TranslationData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      
      // Translate missing keys
      const updatedData = await translateMissingKeys(sourceData, targetData, targetLang, apiKey);
      
      // Sort keys and save
      const sortedData = sortObjectKeys(updatedData);
      fs.writeFileSync(targetPath, JSON.stringify(sortedData, null, 2));
      
      console.log(`✅ ${targetLang} translations updated and saved`);
    }

    console.log('\n🎉 Auto-translation complete!');
    
  } catch (error) {
    console.error('❌ Auto-translation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as translateMissing };
