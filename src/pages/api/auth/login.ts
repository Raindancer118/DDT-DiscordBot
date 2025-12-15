
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    const data = await request.formData();
    // Support both JSON body and FormData for flexibility, though frontend uses FormData
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
    }

    try {
        // 1. Authenticate against External API
        const authResponse = await fetch('https://dumbdecision.de/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!authResponse.ok) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
        }

        const { user, token } = await authResponse.json();

        if (!user || !user.id) {
            return new Response(JSON.stringify({ error: 'Invalid response from auth server' }), { status: 500 });
        }

        // 2. Sync User to Local D1 Database
        const db = locals.runtime.env.DB;

        // Check if user exists
        const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(user.id).first();

        if (existing) {
            await db.prepare(
                'UPDATE users SET email = ?, first_name = ?, last_name = ?, role = ? WHERE id = ?'
            ).bind(user.email, user.firstName, user.lastName, user.role, user.id).run();
        } else {
            await db.prepare(
                'INSERT INTO users (id, email, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)'
            ).bind(user.id, user.email, user.firstName, user.lastName, user.role).run();
        }

        // 3. Set Session
        cookies.set('user_id', user.id.toString(), {
            path: '/',
            httpOnly: true,
            secure: true, // true in prod
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // Optional: Store the token if needed for future API calls to dumbdecision.de
        cookies.set('auth_token', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
        });

        return new Response(JSON.stringify({ success: true, user }), { status: 200 });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Internal User Sync Error' }), { status: 500 });
    }
};

