-- Starboard tracking table
CREATE TABLE IF NOT EXISTS starboard_messages (
    message_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    star_count INTEGER DEFAULT 0,
    starboard_message_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_starboard_channel ON starboard_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_starboard_posted ON starboard_messages(starboard_message_id);
