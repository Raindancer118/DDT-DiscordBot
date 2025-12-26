# ModuleDock Integration Guide

This guide explains how the DDT Daggerheart & Gaming Module integrates with the ModuleDock system and what server administrators need to know.

## 🎯 What is ModuleDock?

ModuleDock is an extensible module system that allows Discord bot administrators to:
- Install verified extension modules from an official store
- Enable/disable modules per server
- Configure module-specific settings
- Manage everything through a web dashboard

## 📦 Module Package Contents

This module includes:

```
module/
├── manifest.json          # Module definition and metadata
├── README.md             # User documentation
├── VERIFICATION.md       # Verification process guide
├── HOSTING.md           # Manifest hosting guide
├── INTEGRATION.md       # This file
└── icon.svg             # Module icon/logo
```

## 🔧 How ModuleDock Works

### For Server Administrators

1. **Browse Modules**
   - Visit the ModuleDock dashboard
   - Browse available verified modules
   - View module descriptions, commands, and settings

2. **Install a Module**
   - Click "Install Module" in the dashboard
   - Module commands become available in your server
   - Configure settings as needed

3. **Manage Modules**
   - Enable/disable modules without uninstalling
   - Configure per-module settings
   - View installed module list with `/modules`

### For Module Developers

1. **Create Module**
   - Define manifest.json with commands and settings
   - Implement command handlers
   - Document usage

2. **Submit for Verification**
   - Submit to ModuleDock team for review
   - Pass security audit
   - Receive cryptographic signature

3. **Publish**
   - Module appears in store
   - Users can install via dashboard
   - Receive usage analytics

## 🗄️ Database Integration

When this module is installed, ModuleDock creates entries in:

### modules table
```sql
INSERT INTO modules (
    module_id,
    name,
    display_name,
    description,
    version,
    author,
    icon_url,
    verified,
    signature,
    manifest_url,
    created_at,
    updated_at
) VALUES (
    'ddt-daggerheart-gaming',
    'ddt-daggerheart-gaming',
    'DDT Daggerheart & Gaming Module',
    'A comprehensive gaming module...',
    '1.1.0',
    'Raindancer118',
    'https://example.com/icon.svg',
    TRUE,
    '<signature>',
    '<manifest_url>',
    unixepoch(),
    unixepoch()
);
```

### module_commands table
```sql
-- One entry per command
INSERT INTO module_commands (
    module_id,
    command_name,
    command_description,
    command_options
) VALUES 
    ('ddt-daggerheart-gaming', 'dh', 'Daggerheart tools', '[...]'),
    ('ddt-daggerheart-gaming', 'coinflip', 'Flip a coin', NULL),
    ('ddt-daggerheart-gaming', 'dice', 'Play dice games', '[...]'),
    -- ... all 12 commands
;
```

### guild_modules table (per server)
```sql
-- When installed in a server
INSERT INTO guild_modules (
    guild_id,
    module_id,
    is_active,
    installed_at
) VALUES (
    '<server_id>',
    'ddt-daggerheart-gaming',
    TRUE,
    unixepoch()
);
```

### module_settings table (per server)
```sql
-- Default settings when installed
INSERT INTO module_settings (
    guild_id,
    module_id,
    setting_key,
    setting_value,
    updated_at
) VALUES 
    ('<server_id>', 'ddt-daggerheart-gaming', 'enable_casino_games', 'true', unixepoch()),
    ('<server_id>', 'ddt-daggerheart-gaming', 'enable_daggerheart', 'true', unixepoch()),
    ('<server_id>', 'ddt-daggerheart-gaming', 'default_bet_amount', '10', unixepoch()),
    ('<server_id>', 'ddt-daggerheart-gaming', 'max_bet_amount', '1000', unixepoch());
```

## 🔌 Command Registration

ModuleDock handles command registration:

1. **Installation**: Commands are registered with Discord API
2. **Per-Server**: Commands appear only in servers with module installed
3. **Updates**: Command changes automatically sync on module update
4. **Uninstall**: Commands removed when module uninstalled

## ⚙️ Settings Management

Settings are managed through:

### Dashboard UI
- Visual interface for all settings
- Real-time validation
- Save/Cancel options
- Setting descriptions

### API Endpoints
```javascript
// Get module settings
GET /api/modules/{guildId}/settings?module_id=ddt-daggerheart-gaming

// Update settings
POST /api/modules/{guildId}/settings
{
  "module_id": "ddt-daggerheart-gaming",
  "settings": {
    "enable_casino_games": true,
    "default_bet_amount": 25
  }
}
```

## 🔐 Security & Permissions

### Module Verification
- Code reviewed by ModuleDock team
- Cryptographically signed
- Only verified modules installable

### Permission Checks
```javascript
// Example: Check if casino games enabled
async function handleCasinoCommand(interaction, env) {
  const settings = await getModuleSettings(
    interaction.guild_id,
    'ddt-daggerheart-gaming'
  );
  
  if (!settings.enable_casino_games) {
    return {
      type: 4,
      data: {
        content: 'Casino games are disabled in this server.',
        flags: 1 << 6
      }
    };
  }
  
  // Continue with command...
}
```

### Rate Limiting
ModuleDock enforces:
- Command rate limits per user
- API rate limits per module
- Resource usage monitoring

## 📊 Analytics & Monitoring

ModuleDock tracks:
- Installation count
- Command usage statistics
- Error rates
- Performance metrics

Available to module authors via dashboard.

## 🔄 Update Process

### Automatic Updates
- Module updates happen automatically
- Commands re-sync with Discord
- Settings schema migrations handled
- Backward compatibility checked

### Manual Updates
Admins can:
- Delay updates
- Review changelogs
- Test in staging
- Rollback if needed

## 🚀 Command Execution Flow

```
User runs /blackjack
    ↓
Discord sends interaction to bot
    ↓
ModuleDock verifies module installed
    ↓
ModuleDock checks module active
    ↓
ModuleDock loads module settings
    ↓
Module command handler executed
    ↓
Response sent to Discord
    ↓
Usage logged in analytics
```

## 🛠️ Developer Tools

### Testing Module Locally

Before submission, test your module:

```bash
# Validate manifest
npm run validate-manifest module/manifest.json

# Test command definitions
npm run test-commands

# Check security issues
npm audit
```

### Module Development Server

Run a local ModuleDock instance:

```bash
# Install ModuleDock CLI
npm install -g moduledock-cli

# Start local test server
moduledock dev --module ./module

# Test commands in Discord
# Test settings via local dashboard
```

## 📱 Dashboard Integration

The module appears in the dashboard:

### Modules Page
```
╔════════════════════════════════════╗
║ DDT Daggerheart & Gaming Module    ║
║ Version: 1.1.0                     ║
║ Author: Raindancer118              ║
║ Status: ● Active                   ║
║ ┌─────────────────────────────┐   ║
║ │ [Settings] [Uninstall]      │   ║
║ └─────────────────────────────┘   ║
╚════════════════════════════════════╝
```

### Settings Page
```
Settings - DDT Daggerheart & Gaming
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☑️ Enable Casino Games
   Enable or disable casino gaming commands

☑️ Enable Daggerheart Tools  
   Enable or disable Daggerheart RPG tools

Default Bet Amount: [  10  ]
   Default bet for casino games

Maximum Bet Amount: [ 1000 ]
   Maximum allowed bet amount

[Save Changes] [Cancel]
```

## 🔗 Related Resources

- [ModuleDock Documentation](link-tbd)
- [Module API Reference](link-tbd)
- [Command Interaction Guide](link-tbd)
- [Security Best Practices](link-tbd)

## 💡 Best Practices

### For This Module
1. Always check settings before command execution
2. Respect bet amount limits
3. Provide clear error messages
4. Handle edge cases gracefully

### For Module Developers
1. Keep manifest.json in sync with code
2. Document all commands thoroughly
3. Test in multiple servers
4. Monitor error rates
5. Respond to user feedback

## 🐛 Debugging

Enable debug mode:
```javascript
// In module code
const DEBUG = process.env.MODULE_DEBUG === 'true';

if (DEBUG) {
  console.log('Command executed:', interaction.data.name);
  console.log('Settings:', settings);
}
```

Check logs in dashboard:
- Command execution logs
- Error traces
- Performance metrics
- User feedback

## 📞 Support

For integration questions:
- ModuleDock Discord: [link-tbd]
- Documentation: [link-tbd]
- GitHub Issues: https://github.com/Raindancer118/DDT-DiscordBot/issues

---

**Integration Version**: 1.0  
**Last Updated**: 2025-12-26  
**Module Version**: 1.1.0
