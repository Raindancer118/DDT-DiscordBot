# Starboard Feature Flow

## How It Works

```
User posts message
       ↓
User A reacts with ⭐
       ↓
Bot counts stars: 1
Bot reacts with: 2️⃣ (2 more needed)
       ↓
User B reacts with ⭐
       ↓
Bot counts stars: 2
Bot removes 2️⃣
Bot reacts with: 1️⃣ (1 more needed)
       ↓
User C reacts with ⭐
       ↓
Bot counts stars: 3 (threshold reached!)
Bot removes 1️⃣
Bot reacts with: ✅ (posted!)
Bot posts to starboard channel ──→ [Starboard Channel]
       ↓
User D reacts with ⭐
       ↓
Bot counts stars: 4
Bot updates starboard post (⭐ **4**)
```

## Bot Reactions

| Stars | Threshold | Bot Reaction |
|-------|-----------|--------------|
| 1     | 3         | 2️⃣          |
| 2     | 3         | 1️⃣          |
| 3     | 3         | ✅ (posted!) |
| 4+    | 3         | ✅ (keeps updating starboard) |

## Starboard Post

When a message reaches the threshold, the bot posts to the starboard channel:

```
⭐ **3** #general-chat

[Message Author Avatar] @Username
Message content goes here...

[Image if present]

🔗 Source: Jump to message
⏰ Posted at: [timestamp]
```

### Embed Colors

- 🟡 **Yellow** (3-4 stars): Just reached threshold
- 🟠 **Orange** (5-9 stars): Popular message
- 🟡 **Gold** (10+ stars): Highly starred!

## Database Tracking

Each starred message is tracked with:
- Original message ID
- Channel ID
- Author ID
- Current star count
- Starboard message ID (once posted)
- Timestamps

This allows:
- Preventing duplicate starboard posts
- Updating star counts in real-time
- Tracking message history
