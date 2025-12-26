#!/usr/bin/env node

/**
 * ModuleDock Manifest Validator
 * 
 * Validates a module manifest against ModuleDock requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_FIELDS = [
  'module_id',
  'name',
  'display_name',
  'description',
  'version',
  'author',
  'verified',
  'signature',
  'manifest_url',
  'commands'
];

const RECOMMENDED_FIELDS = [
  'icon_url',
  'settings_schema'
];

function validateManifest(manifestPath) {
  console.log('🔍 Validating ModuleDock manifest...\n');
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check file exists
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Error: Manifest file not found:', manifestPath);
    return false;
  }

  // Read and parse JSON
  let manifest;
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(content);
    console.log('✅ Valid JSON format');
  } catch (error) {
    console.error('❌ Error: Invalid JSON format');
    console.error('   ', error.message);
    return false;
  }

  // Check required fields
  console.log('\n📋 Checking required fields:');
  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined || manifest[field] === null) {
      console.error(`❌ Missing required field: ${field}`);
      hasErrors = true;
    } else if (manifest[field] === '') {
      console.error(`❌ Empty required field: ${field}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${field}`);
    }
  }

  // Check recommended fields
  console.log('\n💡 Checking recommended fields:');
  for (const field of RECOMMENDED_FIELDS) {
    if (!manifest[field]) {
      console.warn(`⚠️  Missing recommended field: ${field}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${field}`);
    }
  }

  // Validate module_id format
  console.log('\n🔑 Validating module_id:');
  if (manifest.module_id) {
    if (!/^[a-z0-9-]+$/.test(manifest.module_id)) {
      console.error('❌ module_id must contain only lowercase letters, numbers, and hyphens');
      hasErrors = true;
    } else if (manifest.module_id.length < 3) {
      console.error('❌ module_id must be at least 3 characters');
      hasErrors = true;
    } else {
      console.log(`✅ module_id format valid: ${manifest.module_id}`);
    }
  }

  // Validate version format (semantic versioning)
  console.log('\n📦 Validating version:');
  if (manifest.version) {
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      console.error('❌ version must follow semantic versioning (X.Y.Z)');
      hasErrors = true;
    } else {
      console.log(`✅ version format valid: ${manifest.version}`);
    }
  }

  // Validate commands
  console.log('\n⚡ Validating commands:');
  if (!manifest.commands || !Array.isArray(manifest.commands)) {
    console.error('❌ commands must be an array');
    hasErrors = true;
  } else if (manifest.commands.length === 0) {
    console.error('❌ At least one command is required');
    hasErrors = true;
  } else {
    console.log(`✅ Found ${manifest.commands.length} command(s)`);
    
    manifest.commands.forEach((cmd, index) => {
      console.log(`\n   Command ${index + 1}: ${cmd.name || 'unnamed'}`);
      
      if (!cmd.name) {
        console.error('   ❌ Missing command name');
        hasErrors = true;
      } else if (!/^[a-z0-9_-]+$/.test(cmd.name)) {
        console.error('   ❌ Invalid command name format');
        hasErrors = true;
      } else {
        console.log('   ✅ Valid command name');
      }

      if (!cmd.description) {
        console.error('   ❌ Missing command description');
        hasErrors = true;
      } else {
        console.log('   ✅ Has description');
      }

      if (cmd.options) {
        if (!Array.isArray(cmd.options)) {
          console.error('   ❌ options must be an array');
          hasErrors = true;
        } else {
          console.log(`   ✅ Has ${cmd.options.length} option(s)`);
        }
      }
    });
  }

  // Validate settings schema
  if (manifest.settings_schema) {
    console.log('\n⚙️  Validating settings schema:');
    if (!Array.isArray(manifest.settings_schema)) {
      console.error('❌ settings_schema must be an array');
      hasErrors = true;
    } else {
      console.log(`✅ Found ${manifest.settings_schema.length} setting(s)`);
      
      manifest.settings_schema.forEach((setting, index) => {
        console.log(`\n   Setting ${index + 1}: ${setting.key || 'unnamed'}`);
        
        if (!setting.key) {
          console.error('   ❌ Missing setting key');
          hasErrors = true;
        } else {
          console.log('   ✅ Has key');
        }

        if (!setting.label) {
          console.error('   ❌ Missing setting label');
          hasErrors = true;
        } else {
          console.log('   ✅ Has label');
        }

        if (!setting.type) {
          console.error('   ❌ Missing setting type');
          hasErrors = true;
        } else if (!['text', 'number', 'boolean', 'select'].includes(setting.type)) {
          console.error('   ❌ Invalid setting type (must be: text, number, boolean, or select)');
          hasErrors = true;
        } else {
          console.log('   ✅ Valid type');
        }

        if (setting.default === undefined) {
          console.warn('   ⚠️  No default value specified');
          hasWarnings = true;
        }
      });
    }
  }

  // Check signature
  console.log('\n🔐 Checking signature:');
  if (manifest.signature && manifest.signature.includes('PLACEHOLDER')) {
    console.warn('⚠️  Signature is a placeholder - needs official signing');
    hasWarnings = true;
  } else if (manifest.signature) {
    console.log('✅ Signature present');
  }

  // Check manifest_url
  console.log('\n🌐 Checking manifest_url:');
  if (manifest.manifest_url) {
    if (!manifest.manifest_url.startsWith('https://')) {
      console.error('❌ manifest_url must use HTTPS');
      hasErrors = true;
    } else {
      try {
        const manifestUrl = new URL(manifest.manifest_url);
        if (manifestUrl.hostname === 'example.com' || manifestUrl.hostname.endsWith('.example.com')) {
          console.warn('⚠️  manifest_url uses example domain - update before submission');
          hasWarnings = true;
        } else {
          console.log('✅ manifest_url format valid');
        }
      } catch (e) {
        console.error('❌ manifest_url is not a valid URL');
        hasErrors = true;
      }
    }
  }

  // Check icon_url
  if (manifest.icon_url) {
    console.log('\n🎨 Checking icon_url:');
    if (!manifest.icon_url.startsWith('https://') && !manifest.icon_url.startsWith('http://')) {
      console.error('❌ icon_url must be a valid URL');
      hasErrors = true;
    } else {
      try {
        const iconUrl = new URL(manifest.icon_url);
        if (iconUrl.hostname === 'example.com' || iconUrl.hostname.endsWith('.example.com')) {
          console.warn('⚠️  icon_url uses example domain - update before submission');
          hasWarnings = true;
        } else {
          console.log('✅ icon_url format valid');
        }
      } catch (e) {
        console.error('❌ icon_url is not a valid URL');
        hasErrors = true;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary:');
  console.log('='.repeat(50));
  
  if (!hasErrors && !hasWarnings) {
    console.log('✅ All checks passed! Manifest is valid.');
    return true;
  } else if (!hasErrors && hasWarnings) {
    console.log('⚠️  Manifest is valid but has warnings.');
    console.log('   Consider addressing warnings before submission.');
    return true;
  } else {
    console.log('❌ Manifest has errors and must be fixed.');
    return false;
  }
}

// Main execution
const manifestPath = process.argv[2] || path.join(__dirname, '..', 'module', 'manifest.json');
const isValid = validateManifest(manifestPath);

process.exit(isValid ? 0 : 1);
