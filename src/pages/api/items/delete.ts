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

        if (!itemId) {
            return new Response("Missing Item ID", { status: 400 });
        }

        // Delete item
        await db.prepare("DELETE FROM items WHERE id = ?").bind(itemId).run();

        // Cleanup inventory (optional, but good practice)
        await db.prepare("DELETE FROM inventory WHERE item_id = ?").bind(itemId).run();

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Error deleting item:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};
