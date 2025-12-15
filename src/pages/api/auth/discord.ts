
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, cookies, redirect }) => {
    const runtimeEnv = locals.runtime?.env || {};
    const CLIENT_ID = runtimeEnv.CLIENT_ID;
    const REDIRECT_URI = runtimeEnv.DISCORD_REDIRECT_URI;

    if (!CLIENT_ID || !REDIRECT_URI) {
        return new Response('Server configuration error', { status: 500 });
    }

    // Generate random state
    const state = crypto.randomUUID();

    // Store state in cookie (httpOnly, secure)
    cookies.set('discord_oauth_state', state, {
        path: '/',
        httpOnly: true,
        secure: true, // Should be true in production
        sameSite: 'lax',
        maxAge: 60 * 10 // 10 minutes
    });

    // Build Discord OAuth URL
    const url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'identify email');
    url.searchParams.set('state', state);

    return redirect(url.toString());
};
