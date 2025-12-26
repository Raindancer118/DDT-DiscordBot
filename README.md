# DDT Daggerheart & Gaming Discord Bot

A comprehensive Discord bot featuring Daggerheart RPG tools and casino games, now available as a **ModuleDock-compatible module**.

[![ModuleDock Compatible](https://img.shields.io/badge/ModuleDock-Compatible-blue)](module/)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](module/manifest.json)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎮 Features

### Daggerheart RPG Tools
- **Advanced Dice Rolling**: Hope+Fear system, custom expressions, DC checking
- **Multiple Die Sizes**: Support for d4, d6, d8, d10, d12, d20
- **Secret Rolls**: Ephemeral results visible only to roller
- **Modifiers & DC**: Add modifiers and check against difficulty class

### Casino Games
- **Blackjack**: Play 21 against the dealer with hit/stand mechanics
- **Poker**: 5-card draw poker with hand evaluation
- **Roulette**: Full American roulette with all betting options
- **Slots**: Multi-symbol slot machine with progressive payouts
- **Dice**: Classic dice betting with multiple bet types
- **Baccarat**: Player vs Banker vs Tie betting
- **War**: Simple high-card game

### Simple Games
- **Coin Flip**: Quick heads or tails decision maker

### Utility Commands
- **Status**: Check bot operational status and server deployments
- **Login**: Get dashboard login link
- **Clear**: Clear character inventory items

## 🚀 Quick Start

### Option 1: Use as ModuleDock Module (Recommended)

This bot is designed to work with the **ModuleDock** extensible module system. Instead of hosting your own instance, you can install it as a module in any bot using ModuleDock:

1. **Find a bot with ModuleDock** support
2. **Access the dashboard** for your Discord server
3. **Navigate to Modules** section
4. **Search for** "DDT Daggerheart & Gaming Module"
5. **Click Install** and configure settings

See the [Module Documentation](module/README.md) for detailed information.

### Option 2: Self-Host (Traditional)

If you want to run your own instance:

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- Discord Bot Token and Application ID
- Cloudflare Workers account (for deployment)

#### Installation

```bash
# Clone the repository
git clone https://github.com/Raindancer118/DDT-DiscordBot.git
cd DDT-DiscordBot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your tokens
```

#### Environment Variables

Create a `.env` file:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_PUBLIC_KEY=your_public_key_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_test_guild_id_here  # Optional, for guild-specific commands
```

#### Register Commands

```bash
npm run register
```

#### Development

```bash
npm run dev
```

#### Deployment

```bash
npm run deploy
```

## 📋 Commands

### Daggerheart
- `/dh roll [expr] [sides] [mod] [dc] [secret] [animate]` - Roll dice with Hope+Fear system

### Casino Games
- `/blackjack [bet]` - Play Blackjack
- `/poker [bet]` - Play 5-card draw poker
- `/roulette <bet> [amount]` - Spin the roulette wheel
- `/slots [bet]` - Pull the slot machine
- `/dice <bet> [amount]` - Roll dice with betting
- `/baccarat <bet> [amount]` - Bet on Player, Banker, or Tie
- `/war [bet]` - Play War against the dealer

### Simple Games
- `/coinflip` - Flip a coin

### Utility
- `/status` - Check bot status
- `/login` - Get dashboard login link
- `/clear <character_id>` - Clear character inventory

## 🎯 ModuleDock Integration

This bot is **ModuleDock-ready**, meaning it can be installed as a module in any Discord bot that supports the ModuleDock system.

### Module Information
- **Module ID**: `ddt-daggerheart-gaming`
- **Version**: 1.1.0
- **Author**: Raindancer118
- **Status**: Awaiting verification

### Module Files
All ModuleDock-related files are in the [`module/`](module/) directory:
- [`manifest.json`](module/manifest.json) - Module definition and metadata
- [`README.md`](module/README.md) - Module user documentation
- [`INTEGRATION.md`](module/INTEGRATION.md) - Developer integration guide
- [`VERIFICATION.md`](module/VERIFICATION.md) - Verification process guide
- [`HOSTING.md`](module/HOSTING.md) - Manifest hosting guide
- [`icon.svg`](module/icon.svg) - Module icon

### Module Settings
When installed via ModuleDock, admins can configure:
- `enable_casino_games` - Enable/disable casino commands
- `enable_daggerheart` - Enable/disable RPG tools
- `default_bet_amount` - Default bet for casino games
- `max_bet_amount` - Maximum bet limit

## 🏗️ Project Structure

```
DDT-DiscordBot/
├── module/                 # ModuleDock module files
│   ├── manifest.json      # Module definition
│   ├── README.md          # Module documentation
│   ├── INTEGRATION.md     # Integration guide
│   ├── VERIFICATION.md    # Verification guide
│   ├── HOSTING.md         # Hosting guide
│   └── icon.svg           # Module icon
├── src/
│   ├── commands/          # Command implementations
│   │   ├── dh.js         # Daggerheart tools
│   │   ├── blackjack.js  # Blackjack game
│   │   ├── poker.js      # Poker game
│   │   ├── roulette.js   # Roulette game
│   │   ├── slots.js      # Slot machine
│   │   ├── dice.js       # Dice game
│   │   ├── baccarat.js   # Baccarat game
│   │   ├── war.js        # War game
│   │   ├── coinflip.js   # Coin flip
│   │   └── index.js      # Command exports
│   ├── pages/            # Web dashboard pages
│   │   ├── api/          # API endpoints
│   │   ├── dashboard/    # Dashboard UI
│   │   └── index.astro   # Home page
│   ├── lib/              # Utility libraries
│   ├── db/               # Database schemas
│   ├── worker.js         # Cloudflare Worker entry
│   └── register-commands.js  # Command registration
├── public/               # Static assets
├── package.json          # Dependencies
└── astro.config.mjs      # Astro configuration
```

## 🛠️ Technology Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Astro (for dashboard)
- **Styling**: Tailwind CSS
- **Discord API**: discord.js
- **Database**: Cloudflare D1 (SQLite)
- **Verification**: tweetnacl (Ed25519 signatures)

## 📚 Documentation

- **User Guide**: [Module README](module/README.md)
- **Integration Guide**: [INTEGRATION.md](module/INTEGRATION.md)
- **Verification Process**: [VERIFICATION.md](module/VERIFICATION.md)
- **Hosting Guide**: [HOSTING.md](module/HOSTING.md)

## 🔐 Security

### For ModuleDock Installation
- Module must be verified by ModuleDock team
- Cryptographic signature verification
- Code review and security audit required
- Only verified modules can be installed

### For Self-Hosting
- Signature verification on all Discord interactions
- Environment variables for sensitive data
- HTTPS required for all API endpoints
- CORS configured appropriately

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For module updates:
1. Update version in `module/manifest.json`
2. Document changes in PR
3. Submit for re-verification if needed

## 📝 License

[Add your license here - e.g., MIT License]

## 🐛 Issues & Support

- **Bug Reports**: [Open an issue](https://github.com/Raindancer118/DDT-DiscordBot/issues)
- **Feature Requests**: [Open an issue](https://github.com/Raindancer118/DDT-DiscordBot/issues)
- **Questions**: [Discussions](https://github.com/Raindancer118/DDT-DiscordBot/discussions)

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build/)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Uses [discord.js](https://discord.js.org/)
- Compatible with [ModuleDock](link-to-moduledock)

## 📊 Status

- **Bot Status**: ✅ Operational
- **Module Status**: ⏳ Awaiting Verification
- **Version**: 1.1.0
- **Last Updated**: 2025-12-26

---

**Made with ❤️ by Raindancer118**

For ModuleDock integration questions, see the [module documentation](module/README.md).
