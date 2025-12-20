-- Starboard tracking table
CREATE TABLE IF NOT EXISTS starboard_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    original_message_id TEXT NOT NULL,
    original_channel_id TEXT NOT NULL,
    starboard_message_id TEXT,
    star_count INTEGER DEFAULT 0,
    UNIQUE(guild_id, original_message_id)
);
