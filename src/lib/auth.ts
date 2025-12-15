
import { type APIUser } from 'discord.js';

export async function getDiscordUser(token: string): Promise<APIUser | null> {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}

export async function getUserByDiscordId(db: D1Database, discordId: string) {
    const result = await db.prepare(
        `SELECT u.* FROM users u
     JOIN discord_connections dc ON u.id = dc.user_id
     WHERE dc.discord_id = ?`
    ).bind(discordId).first();
    return result;
}

export async function linkDiscordAccount(db: D1Database, userId: number, discordId: string) {
    // Check if link exists
    const existing = await db.prepare(
        'SELECT * FROM discord_connections WHERE discord_id = ?'
    ).bind(discordId).first();

    if (existing) {
        // Already linked, maybe update user_id if differing? For now, throw error or return existing
        if (existing.user_id !== userId) {
            throw new Error('Discord account already linked to another user.');
        }
        return;
    }

    await db.prepare(
        'INSERT INTO discord_connections (discord_id, user_id) VALUES (?, ?)'
    ).bind(discordId, userId).run();
}

// Session Management

export interface Session {
    token: string;
    user_id: number;
    expires_at: number;
}

export async function createSession(db: D1Database, userId: number): Promise<string> {
    const token = crypto.randomUUID();
    // 1 week expiration
    const expiresAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7);

    await db.prepare(
        'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(token, userId, expiresAt).run();

    return token;
}

export async function validateSession(db: D1Database, token: string): Promise<Session | null> {
    const session = await db.prepare(
        'SELECT * FROM sessions WHERE token = ?'
    ).bind(token).first<Session>();

    if (!session) return null;

    // Check expiration
    if (session.expires_at < Math.floor(Date.now() / 1000)) {
        await invalidateSession(db, token); // Cleanup
        return null;
    }

    return session;
}

export async function invalidateSession(db: D1Database, token: string) {
    await db.prepare(
        'DELETE FROM sessions WHERE token = ?'
    ).bind(token).run();
}
