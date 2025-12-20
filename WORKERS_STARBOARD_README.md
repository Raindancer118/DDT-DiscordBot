# Starboard Feature - Cloudflare Workers Implementation

## Overview

The starboard feature is now fully integrated into Cloudflare Workers using Durable Objects to maintain persistent WebSocket connections to Discord's Gateway.

## Architecture

### Components

1. **Worker (src/worker.js)**
   - Handles HTTP interactions (slash commands)
   - Initializes Durable Object for Gateway connection

2. **Durable Object (src/gateway-durable-object.js)**
   - Maintains persistent WebSocket connection to Discord Gateway
   - Listens for MESSAGE_REACTION_ADD and MESSAGE_REACTION_REMOVE events
   - Processes starboard logic

3. **D1 Database**
   - Stores starboard message tracking
   - Schema includes starboard_messages table

## Features

✅ **Fully Cloudflare Workers Compatible**
- Uses native WebSocket API
- Durable Objects for persistent connections
- D1 database for storage

✅ **Starboard Functionality**
- Tracks ⭐ reactions on messages
- Posts to starboard channel when threshold reached (default: 3 stars)
- Shows countdown reactions (1️⃣, 2️⃣, 3️⃣) indicating stars needed
- Shows ✅ when message is posted to starboard
- Real-time star count updates

✅ **Rich Embeds**
- Author information with avatar
- Message content
- Images/attachments
- Link to original message
- Color-coded by star count (yellow → orange → gold)

## Setup

### 1. Configure Secrets

Use Wrangler to set your Discord secrets:

```bash
wrangler secret put DISCORD_TOKEN
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put STARBOARD_CHANNEL_ID
```

### 2. Configure Variables

Edit `wrangler.toml` to set:
- `STAR_THRESHOLD` (default: 3)
- `CLIENT_ID`
- `DISCORD_REDIRECT_URI`

### 3. Update D1 Database Schema

Run the migration to add starboard tables:

```bash
wrangler d1 execute userdata --file=./src/db/schema.sql
```

### 4. Enable Bot Permissions

In Discord Developer Portal, ensure your bot has:
- **Intents:**
  - GUILDS
  - GUILD_MESSAGES
  - GUILD_MESSAGE_REACTIONS
  - MESSAGE_CONTENT (must be explicitly enabled)
  
- **Permissions:**
  - Read Messages/View Channels
  - Send Messages
  - Read Message History
  - Add Reactions
  - Embed Links

### 5. Deploy

```bash
npm run deploy
```

The Durable Object will automatically connect to Discord Gateway on first request.

## How It Works

### User Flow

1. User reacts to a message with ⭐
2. Bot counts total stars on the message
3. Bot updates its reaction:
   - Shows countdown (e.g., 2️⃣ = 2 more stars needed)
   - Shows ✅ when posted to starboard
4. When threshold is reached, message is posted to starboard channel
5. Star count updates live as users add/remove stars

### Technical Flow

1. Worker receives HTTP request
2. Worker initializes Durable Object (if not already running)
3. Durable Object maintains WebSocket connection to Discord Gateway
4. Gateway sends MESSAGE_REACTION_ADD event
5. Durable Object processes event:
   - Checks if it's a ⭐ reaction
   - Queries D1 database for message entry
   - Counts stars via Discord API
   - Updates bot reactions
   - Posts to starboard if threshold reached
6. Database tracks state across all requests

## Configuration

### Environment Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `DISCORD_TOKEN` | Secret | Bot token | Required |
| `STARBOARD_CHANNEL_ID` | Secret | Channel ID for starboard posts | Required |
| `STAR_THRESHOLD` | Variable | Number of stars needed | 3 |
| `DISCORD_PUBLIC_KEY` | Secret | For interaction verification | Required |

### Durable Object

The `DiscordGateway` Durable Object:
- Automatically connects on first Worker request
- Maintains persistent WebSocket connection
- Handles heartbeats and reconnection
- Processes all reaction events

### Database Schema

```sql
CREATE TABLE starboard_messages (
    message_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    star_count INTEGER DEFAULT 0,
    starboard_message_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Gateway not connecting
- Check `DISCORD_TOKEN` is set correctly
- Verify Message Content intent is enabled in Discord Developer Portal
- Check Durable Object binding in wrangler.toml

### Reactions not working
- Ensure bot has "Add Reactions" permission
- Verify bot can read messages in source channels
- Check `STAR_THRESHOLD` is set appropriately

### Starboard not posting
- Verify `STARBOARD_CHANNEL_ID` is correct
- Ensure bot has "Send Messages" permission in starboard channel
- Check bot can read messages in source channels

### Database errors
- Run database migration: `wrangler d1 execute userdata --file=./src/db/schema.sql`
- Verify D1 database binding in wrangler.toml

## Monitoring

Check Worker logs:
```bash
wrangler tail
```

Check D1 database:
```bash
wrangler d1 execute userdata --command="SELECT * FROM starboard_messages"
```

## Development

Local development with Durable Objects:
```bash
npm run dev
```

Note: Durable Objects require a Cloudflare Workers Paid plan for production use.

## Comparison to Previous Implementation

### Before (Node.js Gateway Bot)
- ❌ Required separate server/VPS
- ❌ Node.js specific (discord.js)
- ❌ SQLite file storage
- ❌ Separate deployment

### Now (Cloudflare Workers + Durable Objects)
- ✅ Runs 100% on Cloudflare Workers
- ✅ Native WebSocket API
- ✅ D1 database (serverless)
- ✅ Single deployment
- ✅ Auto-scaling
- ✅ Global edge network

## Cost Considerations

- **Workers**: Included in free tier (100k requests/day)
- **Durable Objects**: Requires Workers Paid plan ($5/month)
- **D1 Database**: Free tier available (5GB storage)

## Additional Resources

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Discord Gateway API](https://discord.com/developers/docs/topics/gateway)
- [D1 Database](https://developers.cloudflare.com/d1/)
