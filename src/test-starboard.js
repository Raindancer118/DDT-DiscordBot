#!/usr/bin/env node
/**
 * Starboard Unit Tests
 * 
 * Tests the starboard database operations and logic without requiring Discord connection
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DB_PATH = join(tmpdir(), 'test-starboard.db');
let db;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message}`);
    console.error(`    Expected: ${expected}`);
    console.error(`    Got: ${actual}`);
    testsFailed++;
  }
}

console.log('🧪 Running Starboard Unit Tests\n');

// Test 1: Database Initialization
console.log('Test 1: Database Initialization');
try {
  db = new Database(TEST_DB_PATH);
  const migrationSQL = readFileSync(join(__dirname, 'db', 'starboard_migration.sql'), 'utf-8');
  db.exec(migrationSQL);
  
  // Check if table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='starboard_messages'
  `).get();
  
  assert(tableCheck !== undefined, 'starboard_messages table created');
  
  // Check table structure
  const columns = db.prepare('PRAGMA table_info(starboard_messages)').all();
  const columnNames = columns.map(c => c.name);
  
  assert(columnNames.includes('id'), 'id column exists');
  assert(columnNames.includes('guild_id'), 'guild_id column exists');
  assert(columnNames.includes('original_message_id'), 'original_message_id column exists');
  assert(columnNames.includes('original_channel_id'), 'original_channel_id column exists');
  assert(columnNames.includes('star_count'), 'star_count column exists');
  assert(columnNames.includes('starboard_message_id'), 'starboard_message_id column exists');
  
} catch (err) {
  console.error('  ✗ Database initialization failed:', err.message);
  testsFailed++;
}

// Test 2: Insert Starboard Entry
console.log('\nTest 2: Insert Starboard Entry');
try {
  const insertStmt = db.prepare(`
    INSERT INTO starboard_messages (guild_id, original_message_id, original_channel_id, star_count)
    VALUES (?, ?, ?, ?)
  `);
  
  insertStmt.run('guild123', '123456789', '987654321', 0);
  
  const entry = db.prepare('SELECT * FROM starboard_messages WHERE guild_id = ? AND original_message_id = ?').get('guild123', '123456789');
  
  assert(entry !== undefined, 'Entry inserted successfully');
  assertEqual(entry.guild_id, 'guild123', 'guild_id is correct');
  assertEqual(entry.original_message_id, '123456789', 'original_message_id is correct');
  assertEqual(entry.original_channel_id, '987654321', 'original_channel_id is correct');
  assertEqual(entry.star_count, 0, 'star_count initialized to 0');
  assert(entry.starboard_message_id === null, 'starboard_message_id is null initially');
  
} catch (err) {
  console.error('  ✗ Insert failed:', err.message);
  testsFailed++;
}

// Test 3: Update Star Count
console.log('\nTest 3: Update Star Count');
try {
  const updateStmt = db.prepare(`
    UPDATE starboard_messages 
    SET star_count = ? 
    WHERE guild_id = ? AND original_message_id = ?
  `);
  
  updateStmt.run(5, 'guild123', '123456789');
  
  const entry = db.prepare('SELECT * FROM starboard_messages WHERE guild_id = ? AND original_message_id = ?').get('guild123', '123456789');
  
  assertEqual(entry.star_count, 5, 'star_count updated to 5');
  
} catch (err) {
  console.error('  ✗ Update failed:', err.message);
  testsFailed++;
}

// Test 4: Update Starboard Message ID
console.log('\nTest 4: Update Starboard Message ID');
try {
  const updateStmt = db.prepare(`
    UPDATE starboard_messages 
    SET starboard_message_id = ? 
    WHERE guild_id = ? AND original_message_id = ?
  `);
  
  updateStmt.run('999888777', 'guild123', '123456789');
  
  const entry = db.prepare('SELECT * FROM starboard_messages WHERE guild_id = ? AND original_message_id = ?').get('guild123', '123456789');
  
  assertEqual(entry.starboard_message_id, '999888777', 'starboard_message_id updated');
  
} catch (err) {
  console.error('  ✗ Update starboard_message_id failed:', err.message);
  testsFailed++;
}

// Test 5: Multiple Entries
console.log('\nTest 5: Multiple Entries');
try {
  const insertStmt = db.prepare(`
    INSERT INTO starboard_messages (guild_id, original_message_id, original_channel_id, star_count)
    VALUES (?, ?, ?, ?)
  `);
  
  insertStmt.run('guild123', 'msg1', 'chan1', 1);
  insertStmt.run('guild123', 'msg2', 'chan1', 3);
  insertStmt.run('guild456', 'msg3', 'chan2', 5);
  
  const allEntries = db.prepare('SELECT * FROM starboard_messages').all();
  
  assertEqual(allEntries.length, 4, 'Total of 4 entries (including previous test)');
  
  const chan1Entries = db.prepare('SELECT * FROM starboard_messages WHERE original_channel_id = ?').all('chan1');
  assertEqual(chan1Entries.length, 2, 'Channel filter works correctly');
  
} catch (err) {
  console.error('  ✗ Multiple entries test failed:', err.message);
  testsFailed++;
}

// Test 6: UNIQUE Constraint
console.log('\nTest 6: UNIQUE Constraint');
try {
  const insertStmt = db.prepare(`
    INSERT INTO starboard_messages (guild_id, original_message_id, original_channel_id, star_count)
    VALUES (?, ?, ?, ?)
  `);
  
  // Try to insert duplicate guild_id + original_message_id
  let errorCaught = false;
  try {
    insertStmt.run('guild123', '123456789', '987654321', 0);
  } catch (e) {
    errorCaught = true;
  }
  
  assert(errorCaught, 'UNIQUE constraint prevents duplicate guild_id + original_message_id');
  
} catch (err) {
  console.error('  ✗ Index check failed:', err.message);
  testsFailed++;
}

// Test 7: Threshold Logic Simulation
console.log('\nTest 7: Threshold Logic Simulation');
try {
  const STAR_THRESHOLD = 3;
  
  // Test case 1: Below threshold
  let starCount = 1;
  let starsNeeded = STAR_THRESHOLD - starCount;
  assertEqual(starsNeeded, 2, 'Stars needed calculation correct (1 star)');
  
  // Test case 2: At threshold
  starCount = 3;
  starsNeeded = STAR_THRESHOLD - starCount;
  assertEqual(starsNeeded, 0, 'Stars needed is 0 at threshold');
  assert(starCount >= STAR_THRESHOLD, 'Should post to starboard at threshold');
  
  // Test case 3: Above threshold
  starCount = 5;
  assert(starCount >= STAR_THRESHOLD, 'Should update starboard above threshold');
  
} catch (err) {
  console.error('  ✗ Threshold logic test failed:', err.message);
  testsFailed++;
}

// Cleanup
console.log('\nCleaning up...');
try {
  db.close();
  await unlink(TEST_DB_PATH);
  console.log('  ✓ Test database cleaned up');
} catch (err) {
  console.error('  ⚠ Warning: Could not delete test database:', err.message);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('✅ All tests PASSED!');
  process.exit(0);
} else {
  console.error('❌ Some tests FAILED');
  process.exit(1);
}
