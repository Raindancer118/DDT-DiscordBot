# Cloudflare Workers Limitation for Starboard

## Technical Constraint

The starboard feature as originally requested **cannot be implemented on Cloudflare Workers** due to fundamental Discord API and Cloudflare platform limitations.

## Why Reaction-Based Starboard Won't Work on Workers

### Discord's Two APIs

Discord provides two ways to interact with bots:

1. **Gateway API (WebSocket)**
   - Real-time bidirectional connection
   - Receives events like: messages, reactions, presence updates, etc.
   - **Requires persistent WebSocket connection**
   - Used by: Traditional Discord bots

2. **Interactions API (HTTP)**
   - Stateless HTTP webhooks
   - Receives events: slash commands, buttons, select menus, modals
   - **Does NOT include reaction events**
   - Used by: Serverless/edge deployments

### Cloudflare Workers Limitation

Cloudflare Workers:
- ✅ Can handle HTTP requests (slash commands, buttons, etc.)
- ❌ Cannot maintain WebSocket connections (no Gateway events)
- ❌ Cannot listen to message reactions

### The Result

**Message reactions (⭐) are Gateway events only** → Cannot be detected on Cloudflare Workers

## Alternative Solutions

### Option 1: Hybrid Deployment ❌ (User Rejected)
- Keep Cloudflare Workers for slash commands
- Deploy separate Gateway bot elsewhere for reactions
- **Status:** User requires 100% Workers, so this is not viable

### Option 2: Command-Based Starboard ✅ (Proposed)
Instead of automatic reactions, use Discord's Message Commands:

**How it works:**
1. User right-clicks a message → Apps → "Star Message"
2. Bot counts how many times that command was used on the message
3. When threshold reached, posts to starboard
4. Bot adds reaction emojis as requested (countdown + ✅)

**Advantages:**
- ✅ 100% runs on Cloudflare Workers
- ✅ Still tracks which messages are highlighted
- ✅ Still posts to starboard channel
- ✅ Still shows countdown and checkmark reactions
- ✅ Achieves the same goal (highlighting great messages)

**Difference:**
- Users click a command instead of adding ⭐ reaction
- Everything else works the same

### Option 3: Slash Command with Message Link 🤔
User runs `/star <message_link>` to star a message.

**Less convenient** than Option 2 but also Workers-compatible.

## Recommended Approach

**Implement Option 2**: Message Command-based starboard
- Maintains all requested features (posting, countdown, checkmark)
- Works 100% on Cloudflare Workers
- User experience is similar (click to star instead of react)
- No infrastructure changes needed

## Implementation Changes Required

If Option 2 is approved:

1. **Remove:** `src/bot.js` (Gateway bot)
2. **Remove:** Database files (or migrate to D1)
3. **Add:** Message Command definition
4. **Add:** Command handler in `src/worker.js`
5. **Add:** D1 database schema for tracking starred messages
6. **Update:** Use Cloudflare D1 instead of SQLite

## Decision Needed

@Raindancer118 Please confirm if Option 2 (Message Command-based starboard) is acceptable, or if you have another approach in mind.

If approved, I'll proceed with reimplementing the feature to work entirely on Cloudflare Workers using Message Commands.
