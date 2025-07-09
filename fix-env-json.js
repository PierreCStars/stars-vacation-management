const fs = require('fs');

console.log('🔧 Fixing JSON formatting in .env file...');

try {
  // Read the current .env file
  const envContent = fs.readFileSync('.env', 'utf8');
  
  // Find the GOOGLE_SERVICE_ACCOUNT_KEY section
  const keyStart = envContent.indexOf('GOOGLE_SERVICE_ACCOUNT_KEY={');
  if (keyStart === -1) {
    console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in .env file');
    process.exit(1);
  }
  
  // Find the end of the JSON (the closing brace)
  let braceCount = 0;
  let keyEnd = keyStart;
  let inString = false;
  let escapeNext = false;
  
  for (let i = keyStart; i < envContent.length; i++) {
    const char = envContent[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          keyEnd = i + 1;
          break;
        }
      }
    }
  }
  
  if (braceCount !== 0) {
    console.log('❌ Malformed JSON - braces not balanced');
    process.exit(1);
  }
  
  // Extract the JSON content
  const jsonContent = envContent.substring(keyStart + 'GOOGLE_SERVICE_ACCOUNT_KEY='.length, keyEnd);
  
  // Parse and re-stringify to ensure it's valid JSON
  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonContent);
  } catch (error) {
    console.log('❌ Invalid JSON:', error.message);
    process.exit(1);
  }
  
  // Create the new single-line JSON
  const newJsonString = JSON.stringify(parsedJson);
  
  // Replace the old JSON with the new one
  const newEnvContent = envContent.substring(0, keyStart) + 
                       'GOOGLE_SERVICE_ACCOUNT_KEY=' + newJsonString +
                       envContent.substring(keyEnd);
  
  // Write the updated .env file
  fs.writeFileSync('.env', newEnvContent);
  
  console.log('✅ Successfully fixed JSON formatting in .env file');
  console.log('📝 JSON is now properly formatted as a single line');
  console.log('🔄 Please restart your development server');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 