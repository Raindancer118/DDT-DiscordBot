
import type { APIRoute } from 'astro';
import { addItemToInventory } from '../../../lib/inventory';
import type { Character } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    const userId = cookies.get('user_id')?.number();
    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const characterId = Number(formData.get('characterId'));
    const itemId = Number(formData.get('itemId'));
    const quantity = Number(formData.get('quantity')) || 1;

    if (!characterId || !itemId) {
        return new Response('Missing required fields', { status: 400 });
    }

    const db = locals.runtime.env.DB;

    // Verify ownership
    const char = await db.prepare('SELECT user_id FROM characters WHERE id = ?').bind(characterId).first<Character>();
    if (!char || char.user_id !== userId) {
        return new Response('Unauthorized access to character', { status: 403 });
    }

    await addItemToInventory(db, characterId, itemId, quantity);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
