CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    rarity TEXT DEFAULT 'common',
    is_custom BOOLEAN DEFAULT 0,
    created_by INTEGER,
    is_public BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS discord_connections (
    discord_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

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
