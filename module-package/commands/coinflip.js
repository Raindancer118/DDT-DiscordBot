/**
 * Handler for the /coinflip command
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


async function originalHandle(interaction, env, ctx) {
  // Generate a random number (0 or 1) to simulate coin flip
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
  
  return {
    type: 4,
    data: {
      content: `🪙 **Coin Flip Result:** ${result}!`
    }
  };
}

export default async function handler(interaction, context) {
  const { env, ctx, moduleSettings } = context;
  
  // Call original handler with adapted parameters
  return originalHandle(interaction, env, ctx);
}
