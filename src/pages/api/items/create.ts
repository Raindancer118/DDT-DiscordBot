
import type { APIRoute } from 'astro';
import { createCustomItem, addItemToInventory } from '../../../lib/inventory';
import type { Item } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    const userId = cookies.get('user_id')?.number();
    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const icon = formData.get('icon') as string;
    const addToInventory = formData.get('addToInventory') === 'true';
    const characterId = Number(formData.get('characterId'));

    if (!name) {
        return new Response('Name is required', { status: 400 });
    }

    const db = locals.runtime.env.DB;

    // Insert Item
    // Note: createCustomItem function in lib might need to return the ID. I should check or update it.
    // SQLite INSERT ... RETURNING id is supported.

    // Custom implementation here to ensure I get ID
    const { results } = await db.prepare(
        'INSERT INTO items (name, description, icon, is_custom, created_by, is_public) VALUES (?, ?, ?, 1, ?, 0) RETURNING id'
    ).bind(name, description, icon, userId).run<{ id: number }>(); // types might not infer correctly for RETURNING, but let's try.
    // Actually run() returns D1Result which usually has `meta` but not `results` for write queries unless RETURNING is used? 
    // D1 documentation says RETURNING is supported but `run()` returns { success, meta }. `first()` or `all()` should be used if we expect rows.
    // Let's use first() for RETURNING.

    const newItem = await db.prepare(
        'INSERT INTO items (name, description, icon, is_custom, created_by, is_public) VALUES (?, ?, ?, 1, ?, 0) RETURNING id'
    ).bind(name, description, icon, userId).first<{ id: number }>();

    if (!newItem) {
        return new Response('Failed to create item', { status: 500 });
    }

    if (addToInventory && characterId) {
        await addItemToInventory(db, characterId, newItem.id, 1);
    }

    return new Response(JSON.stringify({ success: true, item: newItem }), { status: 200 });
};
