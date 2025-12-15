
export interface Item {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    rarity: string;
    is_custom: number; // SQLite boolean
    created_by: number | null;
    is_public: number; // SQLite boolean
}

export interface InventoryItem {
    id: number;
    character_id: number;
    item_id: number;
    quantity: number;
    notes: string | null;
    // Join fields
    name?: string;
    description?: string;
    icon?: string;
    rarity?: string;
}

export interface Character {
    id: number;
    user_id: number;
    campaign_id: number | null;
    name: string;
    status: string;
    bio: string | null;
    avatar_image: string | null;
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string | null;
    role: string;
}

export interface DiscordConnection {
    discord_id: string;
    user_id: number;
}
