# Module Configuration Examples

This document provides example configurations for different server types and use cases.

## 🎮 Configuration Presets

### Preset 1: Full Gaming Server

**Best for**: Servers dedicated to gaming and entertainment

```json
{
  "enable_casino_games": true,
  "enable_daggerheart": true,
  "default_bet_amount": 100,
  "max_bet_amount": 10000
}
```

**Features**:
- ✅ All casino games enabled
- ✅ Daggerheart RPG tools enabled
- 💰 Higher betting limits for experienced players
- 🎯 Suitable for active gaming communities

### Preset 2: RPG-Only Server

**Best for**: Tabletop RPG communities (D&D, Pathfinder, etc.)

```json
{
  "enable_casino_games": false,
  "enable_daggerheart": true,
  "default_bet_amount": 10,
  "max_bet_amount": 100
}
```

**Features**:
- ❌ Casino games disabled
- ✅ Daggerheart dice rolling enabled
- 🎲 Focus on RPG gameplay
- 📖 Perfect for campaign servers

### Preset 3: Casual Gaming Server

**Best for**: General community servers with casual gaming

```json
{
  "enable_casino_games": true,
  "enable_daggerheart": false,
  "default_bet_amount": 10,
  "max_bet_amount": 500
}
```

**Features**:
- ✅ Casino games enabled
- ❌ Daggerheart tools disabled
- 💰 Moderate betting limits
- 🎮 Fun casual gaming experience

### Preset 4: Conservative/Family-Friendly

**Best for**: Family-friendly or conservative communities

```json
{
  "enable_casino_games": false,
  "enable_daggerheart": true,
  "default_bet_amount": 1,
  "max_bet_amount": 10
}
```

**Features**:
- ❌ Casino games disabled (gambling)
- ✅ Dice rolling for games only
- 💰 Minimal bet amounts (symbolic)
- 👨‍👩‍👧‍👦 Safe for all ages

### Preset 5: High Rollers

**Best for**: Competitive gaming communities

```json
{
  "enable_casino_games": true,
  "enable_daggerheart": false,
  "default_bet_amount": 500,
  "max_bet_amount": 100000
}
```

**Features**:
- ✅ Casino games enabled
- ❌ RPG tools disabled
- 💰 Very high betting limits
- 🎰 Competitive casino experience

## 🔧 Setting Descriptions

### enable_casino_games

**Type**: Boolean  
**Default**: `true`  
**Options**: `true` | `false`

Controls access to all casino game commands:
- `/blackjack`
- `/poker`
- `/roulette`
- `/slots`
- `/dice`
- `/baccarat`
- `/war`

**When disabled**: These commands won't appear in Discord's slash command list for your server.

**Use cases**:
- Disable for RPG-only servers
- Disable for family-friendly communities
- Disable if you want only dice rolling features

### enable_daggerheart

**Type**: Boolean  
**Default**: `true`  
**Options**: `true` | `false`

Controls access to Daggerheart RPG tools:
- `/dh roll` (and all subcommands)

**When disabled**: The `/dh` command won't appear in Discord's slash command list.

**Use cases**:
- Disable if you only want casino games
- Disable if your server uses different RPG systems
- Keep enabled for versatile dice rolling

### default_bet_amount

**Type**: Number  
**Default**: `10`  
**Range**: `1` - `1000000`

Sets the default bet amount when players don't specify an amount.

**Examples**:
- `10` - Good for casual play
- `100` - Active gaming communities
- `1` - Conservative/symbolic betting

**Note**: This is for display purposes. Actual currency/points should be managed by your server's economy system.

### max_bet_amount

**Type**: Number  
**Default**: `1000`  
**Range**: `1` - `1000000`

Sets the maximum allowed bet amount for casino games.

**Examples**:
- `100` - Conservative limit
- `1000` - Standard limit
- `10000` - High rollers
- `100000` - No practical limit

**Note**: Commands will reject bets over this amount with an error message.

## 📊 Usage Scenarios

### Scenario 1: New Server Setup

**Goal**: Start with balanced settings and adjust based on community feedback.

**Recommended Config**:
```json
{
  "enable_casino_games": true,
  "enable_daggerheart": true,
  "default_bet_amount": 10,
  "max_bet_amount": 1000
}
```

**Reasoning**: Enables all features with moderate limits. Monitor usage and adjust.

### Scenario 2: Active RPG Campaign

**Goal**: Support weekly D&D/Pathfinder games with dice rolling.

**Recommended Config**:
```json
{
  "enable_casino_games": false,
  "enable_daggerheart": true,
  "default_bet_amount": 1,
  "max_bet_amount": 10
}
```

**Reasoning**: Focus on RPG tools, disable distracting casino games.

### Scenario 3: Casino Night Events

**Goal**: Host special casino night events on weekends.

**Event Config**:
```json
{
  "enable_casino_games": true,
  "enable_daggerheart": false,
  "default_bet_amount": 100,
  "max_bet_amount": 5000
}
```

**Normal Config**:
```json
{
  "enable_casino_games": false,
  "enable_daggerheart": true,
  "default_bet_amount": 10,
  "max_bet_amount": 100
}
```

**Reasoning**: Toggle casino games on/off for special events.

### Scenario 4: Multi-Purpose Community

**Goal**: Support both RPG players and casual gamers.

**Recommended Config**:
```json
{
  "enable_casino_games": true,
  "enable_daggerheart": true,
  "default_bet_amount": 50,
  "max_bet_amount": 2000
}
```

**Reasoning**: All features enabled with moderate-to-high limits.

## 🎯 Best Practices

### For Server Admins

1. **Start Conservative**: Begin with lower limits and increase based on community feedback
2. **Monitor Usage**: Check which commands are most popular
3. **Seasonal Adjustments**: Consider special events with temporarily adjusted settings
4. **Community Input**: Ask your members what they prefer
5. **Document Rules**: Post your betting limits in server rules

### Configuration Tips

1. **Casino Games**: If enabled, ensure you have a points/currency system
2. **Bet Limits**: Set max_bet to match your economy scale
3. **Default Bets**: Set defaults that make sense for typical gameplay
4. **Periodic Review**: Review settings monthly and adjust as needed

### Common Mistakes to Avoid

❌ **Don't**: Set max_bet too low (frustrates players)  
✅ **Do**: Set it high enough for satisfying gameplay

❌ **Don't**: Enable casino without economy integration  
✅ **Do**: Coordinate with your server's currency system

❌ **Don't**: Change settings too frequently  
✅ **Do**: Keep settings stable, announce changes

## 🔄 Changing Settings

Settings can be changed at any time via the dashboard:

1. Go to Dashboard → Modules
2. Find "DDT Daggerheart & Gaming Module"
3. Click "Settings"
4. Update values
5. Click "Save Changes"

**Note**: Changes take effect immediately. Active games complete with old settings.

## 📞 Support

Need help configuring your module?

- Check the [Module README](README.md)
- Review [Integration Guide](INTEGRATION.md)
- Open an issue on GitHub
- Ask in the support server

---

**Examples Version**: 1.0  
**Last Updated**: 2025-12-26  
**Module Version**: 1.1.0
