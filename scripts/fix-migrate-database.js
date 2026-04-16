// Fix Syntax Errors in migrate-database.js
// Usage: node scripts/fix-migrate-database.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing syntax errors in migrate-database.js...\n');

const filePath = path.join(__dirname, '../scripts/migrate-database.js');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix 1: Replace double quotes with single quotes in SQL DEFAULT values
  content = content.replace(/TEXT DEFAULT "([^"]+)"/g, "TEXT DEFAULT '$1'");
  content = content.replace(/JSONB DEFAULT "([^"]+)"/g, "JSONB DEFAULT '$1'");
  
  // Fix 2: Fix comment syntax
  content = content.replace(/-- config, state, event, etc\./g, '-- config, state, event, etc.');
  
  // Fix 3: Ensure proper line endings
  content = content.replace(/\r\n/g, '\n');
  
  // Write fixed content
  fs.writeFileSync(filePath, content);
  
  console.log('✅ Syntax errors fixed in migrate-database.js');
  console.log('📝 Changes made:');
  console.log('   - Replaced double quotes with single quotes in SQL DEFAULT values');
  console.log('   - Fixed comment syntax');
  console.log('   - Normalized line endings');
  
} catch (error) {
  console.error('❌ Error fixing migrate-database.js:', error.message);
  process.exit(1);
}
