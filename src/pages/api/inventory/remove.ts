
import type { APIRoute } from 'astro';
import { type InventoryItem, type Character } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    const userId = cookies.get('user_id')?.number();
    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const inventoryId = Number(formData.get('inventoryId'));
    // const quantity = Number(formData.get('quantity')) || 1; // For now just delete row or decrement? Let's implement delete for simplicity or simple decrement logic.
    // Implementation: If quantity passed -> decrement. If no quantity or resulting <=0 -> delete.
    const delta = -1 * (Number(formData.get('quantity')) || 1); // Remove 1 by default

    if (!inventoryId) {
        return new Response('Missing required fields', { status: 400 });
    }

    const db = locals.runtime.env.DB;

    // Verify ownership via join or two queries
    const itemRow = await db.prepare('SELECT * FROM inventory WHERE id = ?').bind(inventoryId).first<InventoryItem>();
    if (!itemRow) return new Response('Item not found', { status: 404 });

    const char = await db.prepare('SELECT user_id FROM characters WHERE id = ?').bind(itemRow.character_id).first<Character>();

    if (!char || char.user_id !== userId) {
        return new Response('Unauthorized access to character', { status: 403 });
    }

    const newQuantity = itemRow.quantity + delta;

    if (newQuantity <= 0) {
        await db.prepare('DELETE FROM inventory WHERE id = ?').bind(inventoryId).run();
    } else {
        await db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?').bind(newQuantity, inventoryId).run();
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
