
const EPHEMERAL_FLAG = 1 << 6;

export const definition = {
    name: 'login',
    description: 'Link your Discord account to the web dashboard.',
};

export async function handle(interaction, env) {
    const baseUrl = 'https://dc.bot.dumbdecision.de';

    const loginUrl = `${baseUrl}/login`;

    return {
        type: 4,
        data: {
            content: `Click here to log in and link your account: [Dashboard Login](${loginUrl})`,
            flags: EPHEMERAL_FLAG,
        }
    };
}
