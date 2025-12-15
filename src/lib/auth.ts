
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
