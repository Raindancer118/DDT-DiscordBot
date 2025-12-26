# DDT Daggerheart & Gaming Module

A comprehensive ModuleDock-compatible module featuring Daggerheart RPG tools and casino games.

## 📋 Overview

This module provides a complete suite of gaming commands for Discord servers, including:
- **Daggerheart RPG Tools**: Dice rolling system with Hope+Fear mechanics
- **Casino Games**: Blackjack, Poker, Roulette, Slots, Dice, Baccarat, War
- **Simple Games**: Coin flip
- **Utility Commands**: Status checking and dashboard login

## 🎮 Features

### Daggerheart Tools
- `/dh roll` - Comprehensive dice rolling with Hope+Fear system
  - Custom dice expressions (e.g., `4d8 + 10d12 + 2`)
  - Configurable die sizes and modifiers
  - DC (Difficulty Class) checking
  - Secret rolls (ephemeral)
  - Animation support

### Casino Games
- `/blackjack` - Play classic 21 against the dealer
- `/poker` - 5-card draw poker
- `/roulette` - Full roulette with various betting options (numbers, colors, ranges, dozens, columns)
- `/slots` - Slot machine with multiple symbols and jackpots
- `/dice` - Dice betting game with various bet types
- `/baccarat` - Player vs Banker vs Tie betting
- `/war` - Simple high-card game

### Simple Games
- `/coinflip` - Heads or tails

### Utility
- `/status` - Check bot operational status
- `/login` - Get dashboard login link
- `/clear` - Clear character inventory items

## ⚙️ Module Settings

This module provides the following configurable settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_casino_games` | Boolean | `true` | Enable/disable all casino gaming commands |
| `enable_daggerheart` | Boolean | `true` | Enable/disable Daggerheart RPG tools |
| `default_bet_amount` | Number | `10` | Default bet for casino games when not specified |
| `max_bet_amount` | Number | `1000` | Maximum allowed bet amount |

## 📦 Installation

This module is designed to be installed through the ModuleDock system:

1. **Via Dashboard** (Recommended):
   - Go to your server's dashboard
   - Navigate to the "Modules" section
   - Find "DDT Daggerheart & Gaming Module"
   - Click "Install Module"

2. **Via Command**:
   ```
   /modulestore
   ```
   Then select this module from the list

## 🔧 Configuration

After installation, configure the module through your server's dashboard:

1. Go to Dashboard → Modules
2. Click "Settings" on the DDT module
3. Adjust settings according to your server's preferences
4. Save changes

## 📚 Command Details

### Casino Game Bet Types

#### Roulette Bets:
- **Straight Up**: Single number (e.g., `17`)
- **Color**: `red` or `black`
- **Odd/Even**: `odd` or `even`
- **High/Low**: `1-18` or `19-36`
- **Dozens**: `dozen1` (1-12), `dozen2` (13-24), `dozen3` (25-36)
- **Columns**: `column1`, `column2`, `column3`

#### Dice Game Bets:
- **Specific Numbers**: `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`
- **Special**: `craps` (2, 3, or 12), `yo` (11)
- **Ranges**: `over7`, `under7`
- **Parity**: `even`, `odd`

#### Baccarat Bets:
- `player` - Bet on player winning
- `banker` - Bet on banker winning
- `tie` - Bet on a tie

## 🎲 Dice Expression Syntax

The `/dh roll` command supports advanced dice expressions:

```
/dh roll expr:4d8 + 2d12 + 5
/dh roll sides:20 mod:3 dc:15
/dh roll expr:10d6 secret:true
```

**Format**: `[number]d[sides] + [modifier]`
- `4d8` - Roll 4 eight-sided dice
- `+5` - Add 5 to the total
- Multiple dice types can be combined

## 🔒 Permissions

This module inherits the bot's permissions but respects per-server settings. Ensure the bot has:
- `Send Messages` permission
- `Embed Links` permission (for rich game displays)
- `Use Application Commands` permission

## 🐛 Troubleshooting

### Commands not appearing
1. Verify the module is installed and active in your server
2. Check that the bot has proper permissions
3. Try re-syncing commands from the dashboard

### Games not working
1. Check module settings are enabled
2. Verify `enable_casino_games` is set to `true`
3. Check bot permissions in the channel

## 📝 Version History

### v1.1.0
- Initial ModuleDock-compatible release
- All 12 commands included
- Configurable settings schema
- Full casino game suite

## 🤝 Support

For issues or questions:
- Open an issue on GitHub: [Raindancer118/DDT-DiscordBot](https://github.com/Raindancer118/DDT-DiscordBot)
- Check the main bot documentation
- Contact the module author

## 📄 License

This module is part of the DDT-DiscordBot project. See the main repository for license information.

## 🔐 Security & Verification

This module must be verified and cryptographically signed by the ModuleDock official team before it can be installed. The verification process includes:
- Code review by the ModuleDock team
- Security audit
- Cryptographic signing with official private key

**Current Status**: Awaiting official verification and signature

---

**Module ID**: `ddt-daggerheart-gaming`  
**Author**: Raindancer118  
**Version**: 1.1.0
