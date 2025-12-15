
const EPHEMERAL_FLAG = 1 << 6;

export const definition = {
    name: 'login',
    description: 'Link your Discord account to the web dashboard.',
};

export async function handle(interaction, env) {
    // In a real app we might generate a one-time token here to verify the link request comes from this interaction
    // For now, we just direct them to the login page which will handle OAuth
    // We can assume the deployed URL or a configured base URL. 
    // Since we are in a worker environment, we might need a way to know the HOST.
    // However, usually we can just hardcode the production URL or use an env var.
    // For local dev, it's localhost:4321.

    // I will try to use an environment variable if it exists, otherwise fallback to a placeholder or localhost for dev.
    // But since I don't have easy access to set new vars right now without user input, I will use a relative path if possible? 
    // No, discord needs a full URL. 

    // Let's assume production for now or ask user.
    // The user mentioned https://dumbdecision.de/members for creating account.
    // The bot probably runs on a subdomain or same domain.
    // Let's use a standard placeholder that the user can change or I can update later.

    const baseUrl = 'https://ddt-bot.tom-963.workers.dev'; // Example worker url, or I can use the request url if available?
    // Actually, I should probably check if there is a configured URL.

    const loginUrl = `${baseUrl}/login`;

    return {
        type: 4,
        data: {
            content: `Click here to log in and link your account: [Dashboard Login](${loginUrl})`,
            flags: EPHEMERAL_FLAG,
        }
    };
}
