import type { APIRoute } from 'astro';
import { commandDefinitions } from '../../../commands/index.js';

export const POST: APIRoute = async ({ locals, cookies }) => {
    // Check authentication
    const userId = cookies.get('user_id')?.number();
    if (!userId || isNaN(userId) || userId <= 0) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const runtimeEnv = locals.runtime?.env || {};
    const DISCORD_TOKEN = runtimeEnv.DISCORD_TOKEN;
    const CLIENT_ID = runtimeEnv.CLIENT_ID;
    const GUILD_ID = runtimeEnv.GUILD_ID;

    if (!DISCORD_TOKEN || !CLIENT_ID) {
        return new Response(JSON.stringify({ 
            error: 'Server configuration error: Missing Discord credentials' 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Determine the endpoint URL based on whether GUILD_ID is set
        let url: string;
        let scope: string;
        
        if (GUILD_ID) {
            url = `https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`;
            scope = `GUILD:${GUILD_ID}`;
        } else {
            url = `https://discord.com/api/v10/applications/${CLIENT_ID}/commands`;
            scope = 'GLOBAL';
        }

        // Make the request to Discord API
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${DISCORD_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commandDefinitions),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Discord API error:', errorData);
            return new Response(JSON.stringify({ 
                error: `Failed to sync commands: ${response.status} ${response.statusText}`,
                details: errorData
            }), { 
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await response.json();
        const commandList = Array.isArray(result) 
            ? result.map(c => `/${c.name}`).join(', ')
            : '';

        return new Response(JSON.stringify({ 
            success: true,
            message: `Successfully synced ${commandDefinitions.length} command(s) to ${scope}`,
            commands: commandList
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error syncing commands:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to sync commands',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
