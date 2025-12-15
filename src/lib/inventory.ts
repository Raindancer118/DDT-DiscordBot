
import type { InventoryItem, Item, Character } from './db';

export async function getCharacterInventory(db: D1Database, characterId: number): Promise<InventoryItem[]> {
    const { results } = await db.prepare(`
    SELECT inv.*, i.name, i.description, i.icon, i.rarity 
    FROM inventory inv
    JOIN items i ON inv.item_id = i.id
    WHERE inv.character_id = ?
  `).bind(characterId).all<InventoryItem>();
    return results;
}

export async function getAvailableItems(db: D1Database): Promise<Item[]> {
    // Get common items and public custom items
    // NOTE: In a real app we might paginate this or filter by user's custom items too
    const { results } = await db.prepare(`
    SELECT * FROM items 
    WHERE rarity != 'test' 
    ORDER BY name ASC
  `).all<Item>();
    return results;
}

export async function addItemToInventory(db: D1Database, characterId: number, itemId: number, quantity: number = 1) {
    // Check if item already in inventory
    const existing = await db.prepare(
        'SELECT * FROM inventory WHERE character_id = ? AND item_id = ?'
    ).bind(characterId, itemId).first<InventoryItem>();

    if (existing) {
        await db.prepare(
            'UPDATE inventory SET quantity = quantity + ? WHERE id = ?'
        ).bind(quantity, existing.id).run();
    } else {
        await db.prepare(
            'INSERT INTO inventory (character_id, item_id, quantity) VALUES (?, ?, ?)'
        ).bind(characterId, itemId, quantity).run();
    }
}

export async function createCustomItem(db: D1Database, userId: number, name: string, description: string, icon: string) {
    await db.prepare(
        'INSERT INTO items (name, description, icon, is_custom, created_by, is_public) VALUES (?, ?, ?, 1, ?, 0)'
    ).bind(name, description, icon, userId).run();
}
