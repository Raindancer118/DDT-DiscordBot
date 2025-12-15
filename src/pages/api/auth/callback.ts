
import type { APIRoute } from 'astro';
import { getDiscordUser, linkDiscordAccount } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals, cookies, redirect }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    // NOTE: In production, check STATE to prevent CSRF.

    if (!code) {
        return new Response('Missing code', { status: 400 });
    }

    const userId = cookies.get('user_id')?.number();

    if (!userId) {
        // User must be logged in to link account
        return redirect('/login?error=You must be logged in to link your account');
    }

    // Exchange code for token
    const runtimeEnv = locals.runtime?.env || {};
    const CLIENT_ID = runtimeEnv.CLIENT_ID;
    const CLIENT_SECRET = runtimeEnv.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = runtimeEnv.DISCORD_REDIRECT_URI;

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        return new Response('Server configuration error', { status: 500 });
    }

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                scope: 'identify email',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            return new Response(`Error from Discord: ${JSON.stringify(tokenData)}`, { status: 400 });
        }

        const discordUser = await getDiscordUser(tokenData.access_token);

        if (!discordUser) {
            return new Response('Failed to get user info from Discord', { status: 500 });
        }

        // Link in DB
        const db = locals.runtime.env.DB;
        await linkDiscordAccount(db, userId, discordUser.id);

        return redirect('/dashboard?success=Account linked!');

    } catch (e) {
        console.error(e);
        return new Response('Internal error', { status: 500 });
    }
};
