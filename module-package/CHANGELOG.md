# ModuleDock Module - Change Log

All notable changes to the DDT Daggerheart & Gaming Module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-26

### Added - ModuleDock Compatibility
- Created complete ModuleDock module structure in `/module` directory
- Added comprehensive manifest.json with all 12 commands
- Defined settings schema with 4 configurable options:
  - `enable_casino_games` - Toggle casino games on/off
  - `enable_daggerheart` - Toggle Daggerheart tools on/off
  - `default_bet_amount` - Set default bet amount
  - `max_bet_amount` - Set maximum bet limit
- Created module icon (SVG format)
- Added extensive documentation:
  - Module README with usage guide
  - Integration guide for developers
  - Verification guide for submission
  - Hosting guide for manifest deployment
  - Quick start guide for rapid deployment
- Added manifest validation script (`npm run validate-module`)
- Updated repository README with ModuleDock information

### Module Features
- **12 Commands**: dh, coinflip, dice, roulette, slots, blackjack, poker, baccarat, war, clear, status, login
- **4 Settings**: Configurable module behavior per server
- **Verified Structure**: Passes all ModuleDock validation checks
- **Complete Documentation**: User guides, integration docs, and deployment instructions

### Commands Included

#### Daggerheart RPG Tools
- `/dh roll` - Advanced dice rolling with Hope+Fear system, custom expressions, modifiers, DC checking, and secret rolls

#### Casino Games
- `/blackjack` - Play 21 against the dealer
- `/poker` - 5-card draw poker with hand evaluation
- `/roulette` - Full American roulette with multiple bet types
- `/slots` - Multi-symbol slot machine with jackpots
- `/dice` - Classic dice betting game
- `/baccarat` - Player vs Banker vs Tie
- `/war` - Simple high-card game

#### Simple Games
- `/coinflip` - Heads or tails

#### Utility Commands
- `/status` - Check bot operational status
- `/login` - Get dashboard login link
- `/clear` - Clear character inventory items

### Technical Details
- Module ID: `ddt-daggerheart-gaming`
- Version: 1.1.0
- Author: Raindancer118
- Verification Status: Awaiting official signature
- Compatible with: ModuleDock v1.0+

### Files Structure
```
module/
├── manifest.json          # Module definition and metadata
├── icon.svg              # Module visual identity
├── README.md             # User documentation
├── INTEGRATION.md        # Developer integration guide
├── VERIFICATION.md       # Submission and verification guide
├── HOSTING.md           # Manifest hosting instructions
├── QUICKSTART.md        # Quick deployment guide
└── CHANGELOG.md         # This file

scripts/
└── validate-manifest.js  # Validation tool for manifest

README.md                 # Repository overview and ModuleDock info
```

### Next Steps
- [ ] Host manifest.json publicly (GitHub Pages or CDN)
- [ ] Update manifest URLs (manifest_url and icon_url)
- [ ] Submit to ModuleDock team for verification
- [ ] Receive official cryptographic signature
- [ ] Publish to ModuleDock store

## [1.0.0] - Previous

### Initial Release
- Original bot functionality
- Daggerheart dice rolling
- Casino games suite
- Web dashboard
- Cloudflare Workers deployment

---

## Version History

- **1.1.0** - ModuleDock compatibility added
- **1.0.0** - Initial standalone bot release

## Future Roadmap

### Planned Features
- [ ] Additional casino games (Craps, Keno)
- [ ] Leaderboards and statistics
- [ ] Multi-language support
- [ ] Custom game modes
- [ ] Tournament system

### Module Enhancements
- [ ] Per-server game statistics
- [ ] Custom betting limits per channel
- [ ] Configurable game rules
- [ ] Achievement system
- [ ] Economy integration options

---

For detailed installation and usage instructions, see [Module README](README.md).

For submission information, see [VERIFICATION.md](VERIFICATION.md).
