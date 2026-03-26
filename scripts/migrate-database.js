// Database Migration Script for v0.4.0 Transition
// Usage: node scripts/migrate-database.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Starting Database Migration for v0.4.0...\n');

// Configuration
const config = {
  sourceDataDir: path.join(__dirname, '../data'),
  backupDir: path.join(__dirname, '../backups'),
  migrationDir: path.join(__dirname, '../migrations'),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  localDbPath: path.join(__dirname, '../data/database.sqlite')
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Migration functions
function validateEnvironment() {
  colorLog('blue', '🔍 Validating environment...');
  
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    colorLog('red', `❌ Missing environment variables: ${missing.join(', ')}`);
    colorLog('yellow', 'Please configure .env.production with Supabase credentials');
    return false;
  }
  
  colorLog('green', '✅ Environment variables validated');
  return true;
}

function createMigrationDirectory() {
  colorLog('blue', '📁 Creating migration directory...');
  
  if (!fs.existsSync(config.migrationDir)) {
    fs.mkdirSync(config.migrationDir, { recursive: true });
  }
  
  colorLog('green', `✅ Migration directory ready: ${config.migrationDir}`);
  return true;
}

function extractLocalData() {
  colorLog('blue', '📤 Extracting local data...');
  
  const dataFiles = [
    'users.json',
    'characters.json',
    'world_state.json',
    'game_config.json',
    'inventory.json',
    'quests.json'
  ];
  
  const extractedData = {};
  let success = true;
  
  for (const file of dataFiles) {
    const filePath = path.join(config.sourceDataDir, file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        extractedData[file.replace('.json', '')] = data;
        colorLog('green', `✅ Extracted: ${file} (${data.length || Object.keys(data).length} records)`);
      } catch (error) {
        colorLog('red', `❌ Failed to extract ${file}: ${error.message}`);
        success = false;
      }
    } else {
      colorLog('yellow', `⚠️  File not found: ${file}`);
    }
  }
  
  if (success) {
    // Save extracted data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extractedPath = path.join(config.migrationDir, `extracted-data-${timestamp}.json`);
    fs.writeFileSync(extractedPath, JSON.stringify(extractedData, null, 2));
    colorLog('green', `✅ Data extracted to: ${extractedPath}`);
  }
  
  return success ? extractedData : null;
}

function generateSupabaseSchema(data) {
  colorLog('blue', '🏗️  Generating Supabase schema...');
  
  const schema = {
    version: '0.4.0',
    timestamp: new Date().toISOString(),
    tables: {}
  };
  
  // Users table
  if (data.users && data.users.length > 0) {
    schema.tables.users = {
      columns: {
        id: 'TEXT PRIMARY KEY',
        username: 'TEXT UNIQUE NOT NULL',
        email: 'TEXT UNIQUE NOT NULL',
        password_hash: 'TEXT NOT NULL',
        created_at: 'TIMESTAMP DEFAULT NOW()',
        updated_at: 'TIMESTAMP DEFAULT NOW()',
        last_login: 'TIMESTAMP',
        is_active: 'BOOLEAN DEFAULT true',
        level: 'INTEGER DEFAULT 1',
        experience: 'INTEGER DEFAULT 0'
      },
      indexes: [
        'CREATE INDEX idx_users_username ON users(username)',
        'CREATE INDEX idx_users_email ON users(email)',
        'CREATE INDEX idx_users_created_at ON users(created_at)'
      ]
    };
  }
  
  // Characters table
  if (data.characters && data.characters.length > 0) {
    schema.tables.characters = {
      columns: {
        id: 'TEXT PRIMARY KEY',
        user_id: 'TEXT REFERENCES users(id) ON DELETE CASCADE',
        name: 'TEXT NOT NULL',
        class: 'TEXT NOT NULL',
        level: 'INTEGER DEFAULT 1',
        experience: 'INTEGER DEFAULT 0',
        health: 'INTEGER DEFAULT 100',
        max_health: 'INTEGER DEFAULT 100',
        mana: 'INTEGER DEFAULT 50',
        max_mana: 'INTEGER DEFAULT 50',
        strength: 'INTEGER DEFAULT 10',
        agility: 'INTEGER DEFAULT 10',
        intelligence: 'INTEGER DEFAULT 10',
        position_x: 'FLOAT DEFAULT 0',
        position_y: 'FLOAT DEFAULT 0',
        position_z: 'FLOAT DEFAULT 0',
        gold: 'INTEGER DEFAULT 0',
        created_at: 'TIMESTAMP DEFAULT NOW()',
        updated_at: 'TIMESTAMP DEFAULT NOW()',
        last_active: 'TIMESTAMP DEFAULT NOW()'
      },
      indexes: [
        'CREATE INDEX idx_characters_user_id ON characters(user_id)',
        'CREATE INDEX idx_characters_name ON characters(name)',
        'CREATE INDEX idx_characters_level ON characters(level)',
        'CREATE INDEX idx_characters_position ON characters(position_x, position_y)'
      ]
    };
  }
  
  // Inventory table
  if (data.inventory && data.inventory.length > 0) {
    schema.tables.inventory = {
      columns: {
        id: 'TEXT PRIMARY KEY',
        character_id: 'TEXT REFERENCES characters(id) ON DELETE CASCADE',
        item_id: 'TEXT NOT NULL',
        item_name: 'TEXT NOT NULL',
        item_type: 'TEXT NOT NULL',
        quantity: 'INTEGER DEFAULT 1',
        slot: 'INTEGER',
        durability: 'INTEGER DEFAULT 100',
        max_durability: 'INTEGER DEFAULT 100',
        stats: 'JSONB',
        created_at: 'TIMESTAMP DEFAULT NOW()',
        updated_at: 'TIMESTAMP DEFAULT NOW()'
      },
      indexes: [
        'CREATE INDEX idx_inventory_character_id ON inventory(character_id)',
        'CREATE INDEX idx_inventory_item_id ON inventory(item_id)',
        'CREATE INDEX idx_inventory_item_type ON inventory(item_type)'
      ]
    };
  }
  
  // Quests table
  if (data.quests && data.quests.length > 0) {
    schema.tables.quests = {
      columns: {
        id: 'TEXT PRIMARY KEY',
        character_id: 'TEXT REFERENCES characters(id) ON DELETE CASCADE',
        quest_id: 'TEXT NOT NULL',
        quest_name: 'TEXT NOT NULL',
        status: 'TEXT DEFAULT \'available\'', -- available, active, completed, failed
        progress: 'JSONB DEFAULT \'{}\'',
        rewards: 'JSONB DEFAULT \'{}\'',
        started_at: 'TIMESTAMP',
        completed_at: 'TIMESTAMP',
        created_at: 'TIMESTAMP DEFAULT NOW()',
        updated_at: 'TIMESTAMP DEFAULT NOW()'
      },
      indexes: [
        'CREATE INDEX idx_quests_character_id ON quests(character_id)',
        'CREATE INDEX idx_quests_status ON quests(status)',
        'CREATE INDEX idx_quests_quest_id ON quests(quest_id)'
      ]
    };
  }
  
  // World State table
  if (data.world_state && Object.keys(data.world_state).length > 0) {
    schema.tables.world_state = {
      columns: {
        id: 'TEXT PRIMARY KEY',
        key: 'TEXT UNIQUE NOT NULL',
        value: 'JSONB NOT NULL',
        type: 'TEXT NOT NULL', -- config, state, event, etc.
        version: 'INTEGER DEFAULT 1',
        created_at: 'TIMESTAMP DEFAULT NOW()',
        updated_at: 'TIMESTAMP DEFAULT NOW()'
      },
      indexes: [
        'CREATE INDEX idx_world_state_key ON world_state(key)',
        'CREATE INDEX idx_world_state_type ON world_state(type)',
        'CREATE INDEX idx_world_state_updated_at ON world_state(updated_at)'
      ]
    };
  }
  
  // Save schema
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const schemaPath = path.join(config.migrationDir, `supabase-schema-${timestamp}.sql`);
  
  let sql = '-- Gehlenn MMORPG v0.4.0 Database Schema\n';
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  for (const [tableName, table] of Object.entries(schema.tables)) {
    sql += `-- Table: ${tableName}\n`;
    sql += `CREATE TABLE ${tableName} (\n`;
    
    const columns = Object.entries(table.columns)
      .map(([name, type]) => `  ${name} ${type}`)
      .join(',\n');
    
    sql += columns + '\n);\n\n';
    
    // Add indexes
    for (const index of table.indexes) {
      sql += index + ';\n';
    }
    sql += '\n';
  }
  
  fs.writeFileSync(schemaPath, sql);
  colorLog('green', `✅ Schema generated: ${schemaPath}`);
  
  return schemaPath;
}

function generateMigrationSQL(data) {
  colorLog('blue', '📝 Generating migration SQL...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const migrationPath = path.join(config.migrationDir, `migration-data-${timestamp}.sql`);
  
  let sql = '-- Gehlenn MMORPG v0.4.0 Data Migration\n';
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  // Migrate users
  if (data.users && data.users.length > 0) {
    sql += '-- Users\n';
    for (const user of data.users) {
      const values = [
        `'${user.id || generateUUID()}'`,
        `'${user.username}'`,
        `'${user.email || user.username + '@example.com'}'`,
        `'${user.password_hash || 'hashed_password'}'`,
        `'${user.created_at || new Date().toISOString()}'`,
        `'${user.updated_at || new Date().toISOString()}'`,
        user.last_login ? `'${user.last_login}'` : 'NULL',
        `'${user.is_active !== false}'`,
        `'${user.level || 1}'`,
        `'${user.experience || 0}'`
      ];
      
      sql += `INSERT INTO users (id, username, email, password_hash, created_at, updated_at, last_login, is_active, level, experience) VALUES (${values.join(', ')});\n`;
      sql += `INSERT INTO users (id, username, email, password_hash, created_at, updated_at, last_login, is_active, level, experience) VALUES (${values.join(', ')});\n`;
      }
    }
    sql += '\n';
  }
  
  // Migrate characters
  if (data.characters && data.characters.length > 0) {
    sql += '-- Characters\n';
    for (const char of data.characters) {
      const values = [
        `'${char.id || generateUUID()}'`,
        `'${char.user_id}'`,
        `'${char.name}'`,
        `'${char.class || 'warrior'}'`,
        `'${char.level || 1}'`,
        `'${char.experience || 0}'`,
        `'${char.health || 100}'`,
        `'${char.max_health || 100}'`,
        `'${char.mana || 50}'`,
        `'${char.max_mana || 50}'`,
        `'${char.strength || 10}'`,
        `'${char.agility || 10}'`,
        `'${char.intelligence || 10}'`,
        `'${char.position?.x || 0}'`,
        `'${char.position?.y || 0}'`,
        `'${char.position?.z || 0}'`,
        `'${char.gold || 0}'`,
        `'${char.created_at || new Date().toISOString()}'`,
        `'${char.updated_at || new Date().toISOString()}'`,
        `'${char.last_active || new Date().toISOString()}'`
      ];
      
      sql += `INSERT INTO characters (id, user_id, name, class, level, experience, health, max_health, mana, max_mana, strength, agility, intelligence, position_x, position_y, position_z, gold, created_at, updated_at, last_active) VALUES (${values.join(', ')});\n`;
    }
    sql += '\n';
  }
  
  // Migrate inventory
  if (data.inventory && data.inventory.length > 0) {
    sql += '-- Inventory\n';
    for (const item of data.inventory) {
      const values = [
        `'${item.id || generateUUID()}'`,
        `'${item.character_id}'`,
        `'${item.item_id}'`,
        `'${item.name || item.item_name}'`,
        `'${item.type || item.item_type}'`,
        `'${item.quantity || 1}'`,
        item.slot ? `'${item.slot}'` : 'NULL',
        `'${item.durability || 100}'`,
        `'${item.max_durability || 100}'`,
        `'${JSON.stringify(item.stats || {})}'`,
        `'${item.created_at || new Date().toISOString()}'`,
        `'${item.updated_at || new Date().toISOString()}'`
      ];
      
      sql += `INSERT INTO inventory (id, character_id, item_id, item_name, item_type, quantity, slot, durability, max_durability, stats, created_at, updated_at) VALUES (${values.join(', ')});\n`;
    }
    sql += '\n';
  }
  
  // Migrate quests
  if (data.quests && data.quests.length > 0) {
    sql += '-- Quests\n';
    for (const quest of data.quests) {
      const values = [
        `'${quest.id || generateUUID()}'`,
        `'${quest.character_id}'`,
        `'${quest.quest_id}'`,
        `'${quest.name || quest.quest_name}'`,
        `'${quest.status || 'available'}'`,
        `'${JSON.stringify(quest.progress || {})}'`,
        `'${JSON.stringify(quest.rewards || {})}'`,
        quest.started_at ? `'${quest.started_at}'` : 'NULL',
        quest.completed_at ? `'${quest.completed_at}'` : 'NULL',
        `'${quest.created_at || new Date().toISOString()}'`,
        `'${quest.updated_at || new Date().toISOString()}'`
      ];
      
      sql += `INSERT INTO quests (id, character_id, quest_id, quest_name, status, progress, rewards, started_at, completed_at, created_at, updated_at) VALUES (${values.join(', ')});\n`;
    }
    sql += '\n';
  }
  
  // Migrate world state
  if (data.world_state && Object.keys(data.world_state).length > 0) {
    sql += '-- World State\n';
    for (const [key, value] of Object.entries(data.world_state)) {
      const values = [
        `'${generateUUID()}'`,
        `'${key}'`,
        `'${JSON.stringify(value)}'`,
        `'${typeof value === 'object' && value.type ? value.type : 'state'}'`,
        `'1'`,
        `'${new Date().toISOString()}'`,
        `'${new Date().toISOString()}'`
      ];
      
      sql += `INSERT INTO world_state (id, key, value, type, version, created_at, updated_at) VALUES (${values.join(', ')});\n`;
    }
  }
  
  fs.writeFileSync(migrationPath, sql);
  colorLog('green', `✅ Migration SQL generated: ${migrationPath}`);
  
  return migrationPath;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function executeMigration(schemaPath, migrationPath) {
  colorLog('blue', '🚀 Executing migration...');
  
  try {
    // This would typically use the Supabase client or psql
    // For now, we'll create a script that can be executed manually
    
    const script = `#!/bin/bash
# Database Migration Script
# Execute this script to migrate data to Supabase

# Set variables
SUPABASE_URL="${config.supabaseUrl}"
SUPABASE_KEY="${config.supabaseKey}"

# Execute schema
echo "Creating schema..."
curl -X POST "\$SUPABASE_URL/rest/v1/rpc/execute_sql" \\
  -H "Authorization: Bearer \$SUPABASE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sql": "'"$(cat ${schemaPath}"'"}"}'

# Execute data migration
echo "Migrating data..."
curl -X POST "\$SUPABASE_URL/rest/v1/rpc/execute_sql" \\
  -H "Authorization: Bearer \$SUPABASE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sql": "'"$(cat ${migrationPath}"'"}"}'

echo "Migration completed!"
`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const scriptPath = path.join(config.migrationDir, `execute-migration-${timestamp}.sh`);
    fs.writeFileSync(scriptPath, script);
    
    // Make executable
    fs.chmodSync(scriptPath, '755');
    
    colorLog('green', `✅ Migration script created: ${scriptPath}`);
    colorLog('yellow', '⚠️  Please execute this script manually to complete the migration:');
    colorLog('blue', `   bash ${scriptPath}`);
    
    return scriptPath;
    
  } catch (error) {
    colorLog('red', `❌ Migration execution failed: ${error.message}`);
    return null;
  }
}

function generateReport(results) {
  colorLog('magenta', '\n📊 Migration Report');
  colorLog('magenta', '==================');
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    version: '0.4.0',
    results,
    summary: {
      passed: results.filter(r => r.status).length,
      failed: results.filter(r => !r.status).length,
      total: results.length
    }
  };
  
  // Save report
  const reportPath = path.join(config.migrationDir, `migration-report-${timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  colorLog('green', `✅ Report saved: ${reportPath}`);
  
  // Display summary
  colorLog('magenta', `\nSummary: ${report.summary.passed}/${report.summary.total} steps completed`);
  
  return report.summary.failed === 0;
}

// Main execution
async function main() {
  const results = [];
  
  try {
    // Run migration steps
    results.push({
      step: 'Environment Validation',
      status: validateEnvironment()
    });
    
    results.push({
      step: 'Migration Directory',
      status: createMigrationDirectory()
    });
    
    const data = extractLocalData();
    results.push({
      step: 'Data Extraction',
      status: !!data,
      details: data ? `${Object.keys(data).length} data types extracted` : 'Failed to extract data'
    });
    
    if (data) {
      const schemaPath = generateSupabaseSchema(data);
      results.push({
        step: 'Schema Generation',
        status: !!schemaPath,
        details: schemaPath ? 'Schema SQL generated' : 'Failed to generate schema'
      });
      
      const migrationPath = generateMigrationSQL(data);
      results.push({
        step: 'Migration SQL',
        status: !!migrationPath,
        details: migrationPath ? 'Migration SQL generated' : 'Failed to generate migration SQL'
      });
      
      if (schemaPath && migrationPath) {
        const scriptPath = executeMigration(schemaPath, migrationPath);
        results.push({
          step: 'Migration Script',
          status: !!scriptPath,
          details: scriptPath ? 'Script created for manual execution' : 'Failed to create script'
        });
      }
    }
    
    // Generate final report
    const success = generateReport(results);
    
    if (success) {
      colorLog('green', '\n🎉 Database migration prepared successfully!');
      colorLog('blue', 'Ready to execute migration script.');
    } else {
      colorLog('red', '\n❌ Database migration failed. Please address issues before proceeding.');
      process.exit(1);
    }
    
  } catch (error) {
    colorLog('red', `❌ Migration error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, config };
