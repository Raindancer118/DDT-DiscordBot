
import type { APIRoute } from 'astro';
import { getDiscordUser, linkDiscordAccount } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals, cookies, redirect }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // Verify State
    const storedState = cookies.get('discord_oauth_state')?.value;
    if (!storedState || storedState !== state) {
        return new Response('Invalid state parameter', { status: 400 });
    }

    // Clear state cookie
    cookies.delete('discord_oauth_state', { path: '/' });

    if (!code) {
        return new Response('Missing code', { status: 400 });
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

        const db = locals.runtime.env.DB;
        const userId = cookies.get('user_id')?.number();

        if (userId) {
            // Case 1: Link Account (User is already logged in)
            await linkDiscordAccount(db, userId, discordUser.id);
            return redirect('/dashboard?success=Account linked!');
        } else {
            // Case 2: Login with Discord (User is not logged in)
            // Check if discord ID is linked to a user
            const connection = await db.prepare('SELECT user_id FROM discord_connections WHERE discord_id = ?')
                .bind(discordUser.id)
                .first();

            if (connection && connection.user_id) {
                // User found, log them in
                cookies.set('user_id', connection.user_id.toString(), {
                    path: '/',
                    httpOnly: true,
                    secure: true, // true in prod
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 1 week
                });
                return redirect('/dashboard');
            } else {
                // User not found
                return redirect('/login?error=No account linked with this Discord user. Please log in normally and link your account first.');
            }
        }

    } catch (e) {
        console.error(e);
        return new Response('Internal error', { status: 500 });
    }
};
