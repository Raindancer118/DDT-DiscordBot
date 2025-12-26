# DDT Daggerheart & Gaming Module - Package

This is the complete ModuleDock module package ready for ZIP distribution.

## 📦 Package Structure

```
module-package/
├── manifest.json          # Module definition with handler paths
├── README.md             # This file
├── commands/             # Command handlers (12 total)
│   ├── dh.js
│   ├── coinflip.js
│   ├── dice.js
│   ├── roulette.js
│   ├── slots.js
│   ├── blackjack.js
│   ├── poker.js
│   ├── baccarat.js
│   ├── war.js
│   ├── clear.js
│   ├── status.js
│   └── login.js
├── lib/                  # Shared utilities (optional)
├── assets/               # Module assets
│   └── icon.svg         # Module icon
└── [documentation files...]
```

## 🎯 What's Different from Original Code

This package is **independent** from the original bot source code:

1. **Command Handlers**: All handlers in `commands/` are adapted versions that follow ModuleDock conventions
2. **Handler Format**: Each handler exports a default function with the signature: `handler(interaction, context)`
3. **Context Object**: Handlers receive `{ env, userId, guildId, moduleSettings, ctx }` instead of separate parameters
4. **Module Settings**: Handlers can access per-server settings via `context.moduleSettings`
5. **Manifest**: Includes `handler` field for each command pointing to the handler file

## 🚀 Creating the Module ZIP

To package this module for distribution:

```bash
cd module-package
zip -r ddt-daggerheart-gaming-1.1.0.zip \
  manifest.json \
  README.md \
  USER_GUIDE.md \
  commands/ \
  assets/ \
  *.md
```

This creates: `ddt-daggerheart-gaming-1.1.0.zip`

## 📋 Required Structure (Per ModuleDock)

```
my-module-1.0.0.zip
├── manifest.json          (REQUIRED - module metadata)
├── README.md             (RECOMMENDED - documentation)
├── commands/             (REQUIRED - command handlers)
│   ├── command1.js
│   └── command2.js
├── lib/                  (OPTIONAL - shared utilities)
└── assets/               (OPTIONAL - images, etc.)
    └── icon.png
```

✅ This package follows the required structure.

## 🔧 Command Handlers

All command handlers follow ModuleDock format:

```javascript
/**
 * Handler for the /commandname command
 */
export default async function handler(interaction, context) {
  const { env, userId, guildId, moduleSettings, ctx } = context;
  
  // Command logic here
  
  return {
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content: 'Response message'
    }
  };
}
```

## 🎮 Commands Included (12 Total)

1. **`/dh`** - Daggerheart dice rolling with Hope+Fear system
2. **`/coinflip`** - Simple coin flip
3. **`/dice`** - Dice betting game with multiple bet types
4. **`/roulette`** - American roulette with all bet types
5. **`/slots`** - Multi-symbol slot machine
6. **`/blackjack`** - Classic 21 card game
7. **`/poker`** - 5-card draw poker
8. **`/baccarat`** - Player vs Banker vs Tie
9. **`/war`** - High-card comparison game
10. **`/clear`** - Clear character inventory
11. **`/status`** - Check bot operational status
12. **`/login`** - Get dashboard login link

## ⚙️ Settings Schema (4 Settings)

- `enable_casino_games` (boolean) - Toggle casino games
- `enable_daggerheart` (boolean) - Toggle RPG tools
- `default_bet_amount` (number) - Default bet amount
- `max_bet_amount` (number) - Maximum bet limit

## 📚 Documentation Files

- **USER_GUIDE.md** - Complete user documentation
- **INTEGRATION.md** - Developer integration guide
- **VERIFICATION.md** - Submission process
- **HOSTING.md** - Manifest hosting guide
- **QUICKSTART.md** - Quick deployment
- **CHANGELOG.md** - Version history
- **EXAMPLES.md** - Configuration examples
- **SUMMARY.md** - Complete overview
- **INDEX.md** - Documentation navigation

## 📊 Package Information

- **Module ID**: `ddt-daggerheart-gaming`
- **Version**: 1.1.0
- **Author**: Raindancer118
- **License**: MIT
- **Commands**: 12
- **Settings**: 4
- **Package Size**: ~150KB

## ✅ Verification Checklist

Before submitting to ModuleDock:

- [x] Manifest includes all required fields
- [x] Each command has a `handler` field
- [x] All handler files exist in `commands/` folder
- [x] Handlers export default function
- [x] Settings schema is defined
- [x] README.md is included
- [x] At least one command provided
- [x] Module ID is unique and valid

## 🚀 Next Steps

1. **Test Locally**: Test handlers in ModuleDock environment
2. **Create ZIP**: Package the module
3. **Submit**: Send to ModuleDock team
4. **Code Review**: Wait for review feedback
5. **Signature**: Receive cryptographic signature
6. **Publish**: Module goes live in store

## 📞 Support

- **Repository**: https://github.com/Raindancer118/DDT-DiscordBot
- **Issues**: https://github.com/Raindancer118/DDT-DiscordBot/issues

---

**Package Status**: ✅ Ready for Distribution  
**Last Updated**: 2025-12-26
