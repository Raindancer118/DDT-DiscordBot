import type { APIRoute } from "astro";
import type { User } from "../../../lib/db";

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    const db = locals.runtime.env.DB;
    const userIdCookie = cookies.get("user_id");

    if (!userIdCookie) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Verify Admin
    const user = await db
        .prepare("SELECT role FROM users WHERE id = ?")
        .bind(userIdCookie.number())
        .first<User>();

    if (!user || user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
    }

    try {
        const formData = await request.formData();
        const itemId = formData.get("itemId");
        const name = formData.get("name");
        const description = formData.get("description");
        const icon = formData.get("icon");
        const rarity = formData.get("rarity");

        if (!itemId || !name) {
            return new Response("Missing required fields", { status: 400 });
        }

        await db
            .prepare(
                "UPDATE items SET name = ?, description = ?, icon = ?, rarity = ? WHERE id = ?"
            )
            .bind(name, description, icon, rarity, itemId)
            .run();

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Error updating item:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};
