export const definition = {
    name: 'status',
    description: 'Checks if the bot is online.'
};

export async function handle(interaction, env, ctx) {
    return {
        type: 4,
        data: {
            content: 'Online! 🫡'
        }
    };
}
