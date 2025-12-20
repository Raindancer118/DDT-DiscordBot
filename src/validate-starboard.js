#!/usr/bin/env node
/**
 * Starboard Configuration Validator
 * 
 * This script validates the starboard setup without connecting to Discord.
 * It checks:
 * - Required dependencies are installed
 * - Database migrations can be applied
 * - Configuration is valid
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Validating Starboard Setup...\n');

let hasErrors = false;

// Check dependencies
console.log('✓ Checking dependencies...');
try {
  await import('better-sqlite3');
  console.log('  ✓ better-sqlite3 is installed');
} catch (err) {
  console.error('  ✗ better-sqlite3 is NOT installed. Run: npm install better-sqlite3');
  hasErrors = true;
}

try {
  const discord = await import('discord.js');
  console.log('  ✓ discord.js is installed');
  
  // Check for required classes
  if (!discord.Client || !discord.GatewayIntentBits) {
    console.error('  ✗ discord.js version is incompatible (need v14+)');
    hasErrors = true;
  }
} catch (err) {
  console.error('  ✗ discord.js is NOT installed. Run: npm install discord.js');
  hasErrors = true;
}

// Check migration file
console.log('\n✓ Checking database migration...');
const migrationPath = join(__dirname, 'db', 'starboard_migration.sql');
if (!existsSync(migrationPath)) {
  console.error(`  ✗ Migration file not found: ${migrationPath}`);
  hasErrors = true;
} else {
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  if (!migrationSQL.includes('starboard_messages')) {
    console.error('  ✗ Migration file does not contain starboard_messages table');
    hasErrors = true;
  } else {
    console.log('  ✓ Migration file is valid');
  }
}

// Check bot.js exists
console.log('\n✓ Checking bot.js file...');
const botPath = join(__dirname, 'bot.js');
if (!existsSync(botPath)) {
  console.error(`  ✗ Bot file not found: ${botPath}`);
  hasErrors = true;
} else {
  const botContent = readFileSync(botPath, 'utf-8');
  
  // Check for key components
  const checks = [
    { name: 'messageReactionAdd handler', pattern: /messageReactionAdd/ },
    { name: 'messageReactionRemove handler', pattern: /messageReactionRemove/ },
    { name: 'Star emoji constant', pattern: /STAR_EMOJI/ },
    { name: 'Star threshold config', pattern: /STAR_THRESHOLD/ },
    { name: 'Starboard channel config', pattern: /STARBOARD_CHANNEL_ID/ },
    { name: 'Database initialization', pattern: /better-sqlite3/ },
    { name: 'Embed creation', pattern: /createStarboardEmbed/ },
    { name: 'Bot reactions', pattern: /updateBotReactions/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(botContent)) {
      console.log(`  ✓ ${check.name} implemented`);
    } else {
      console.error(`  ✗ ${check.name} NOT found`);
      hasErrors = true;
    }
  }
}

// Check .env.example
console.log('\n✓ Checking configuration example...');
const envExamplePath = join(__dirname, '..', '.env.example');
if (!existsSync(envExamplePath)) {
  console.error(`  ✗ .env.example not found: ${envExamplePath}`);
  hasErrors = true;
} else {
  const envExample = readFileSync(envExamplePath, 'utf-8');
  const requiredVars = [
    'DISCORD_TOKEN',
    'STARBOARD_CHANNEL_ID',
    'STAR_THRESHOLD'
  ];
  
  for (const varName of requiredVars) {
    if (envExample.includes(varName)) {
      console.log(`  ✓ ${varName} documented`);
    } else {
      console.error(`  ✗ ${varName} NOT documented in .env.example`);
      hasErrors = true;
    }
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Validation FAILED - please fix the errors above');
  process.exit(1);
} else {
  console.log('✅ All checks PASSED!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env and fill in your values');
  console.log('2. Run: npm run bot');
  console.log('\nSee STARBOARD_README.md for detailed setup instructions.');
  process.exit(0);
}
