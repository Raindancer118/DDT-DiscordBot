# DDT Discord Bot - Starboard Feature

## Overview

The starboard feature allows users to highlight exceptional messages by reacting with a ⭐ emoji. When a message receives enough stars, it gets posted to a designated starboard channel.

## Features

1. **Star Tracking**: Messages are tracked when users react with ⭐
2. **Countdown Reactions**: The bot shows how many more stars are needed (e.g., 2️⃣ means 2 more stars needed)
3. **Success Indicator**: When a message is posted to starboard, the bot adds a ✅ reaction
4. **Starboard Posts**: Messages that reach the threshold are posted to the starboard channel with:
   - Author information
   - Message content
   - Link to original message
   - Star count
   - Images/attachments (if present)
5. **Live Updates**: Starboard posts update in real-time as star counts change

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required variables:
- `DISCORD_TOKEN`: Your Discord bot token
- `STARBOARD_CHANNEL_ID`: The channel ID where starred messages will be posted
- `STAR_THRESHOLD`: Number of stars required (default: 3)
- `DB_PATH`: Path to SQLite database file (default: ./starboard.db)

### 3. Set Up Database

The database will be automatically created and migrated when you first run the bot.

### 4. Configure Bot Permissions

Your bot needs the following permissions:
- Read Messages/View Channels
- Send Messages
- Read Message History
- Add Reactions
- Use External Emojis

Bot intents required (already configured in code):
- Guilds
- GuildMessages
- GuildMessageReactions
- MessageContent

### 5. Run the Bot

There are two components to run:

**Cloudflare Worker (for slash commands):**
```bash
npm run deploy
```

**Gateway Bot (for starboard reactions):**
```bash
npm run bot
```

For development:
```bash
# Terminal 1: Run Astro dev server
npm run dev

# Terminal 2: Run the bot
npm run bot
```

## Usage

1. Users react to messages with ⭐
2. Bot shows countdown reaction (e.g., 2️⃣) indicating stars needed
3. When threshold is reached, message is posted to starboard with ✅ reaction
4. Star count updates live on both original message and starboard post

## Deployment

The starboard bot requires a persistent process with WebSocket connection to Discord Gateway. This cannot run on Cloudflare Workers. Deploy options:

1. **VPS/Server**: Run `npm run bot` with process manager (PM2, systemd)
2. **Heroku/Railway**: Add Procfile: `bot: node src/bot.js`
3. **Docker**: Create container running the bot process

## Database Schema

The starboard uses SQLite with the following table:

```sql
starboard_messages (
    message_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    star_count INTEGER DEFAULT 0,
    starboard_message_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Troubleshooting

**Bot not reacting to stars:**
- Verify `DISCORD_TOKEN` is set correctly
- Check bot has "Add Reactions" permission
- Ensure Message Content intent is enabled in Discord Developer Portal

**Messages not posting to starboard:**
- Verify `STARBOARD_CHANNEL_ID` is correct
- Check bot has "Send Messages" permission in starboard channel
- Ensure bot can read messages in source channels

**Database errors:**
- Check `DB_PATH` directory is writable
- Verify database file permissions

## Architecture

- **Cloudflare Worker** (`src/worker.js`): Handles slash command interactions via HTTP
- **Gateway Bot** (`src/bot.js`): Maintains WebSocket connection for real-time reaction events
- **Database**: SQLite for tracking starred messages (separate from D1 database)

## Development

To modify starboard behavior:

- **Change star threshold**: Set `STAR_THRESHOLD` environment variable
- **Change star emoji**: Modify `STAR_EMOJI` constant in `src/bot.js`
- **Customize embed**: Edit `createStarboardEmbed()` function
- **Modify reactions**: Edit `updateBotReactions()` function
