/**
 * Handler for the /login command
 * Adapted from original bot source
 * 
 * @param {object} interaction - Discord interaction object
 * @param {object} context - Command context
 * @param {Env} context.env - Environment with DB, AI, etc.
 * @param {string} context.userId - User who invoked command
 * @param {string} context.guildId - Server ID
 * @param {object} context.moduleSettings - Module settings for this server
 * @returns {object} Discord interaction response
 */


const EPHEMERAL_FLAG = 1 << 6;


async function originalHandle(interaction, env, ctx) {
    const baseUrl = 'https://dc.bot.dumbdecision.de';

    const loginUrl = `${baseUrl}/login?from=command`;

    return {
        type: 4,
        data: {
            content: `Click here to log in and link your account: [Dashboard Login](${loginUrl})`,
            flags: EPHEMERAL_FLAG,
        }
    };
}

export default async function handler(interaction, context) {
  const { env, ctx, moduleSettings } = context;
  
  // Call original handler with adapted parameters
  return originalHandle(interaction, env, ctx);
}
