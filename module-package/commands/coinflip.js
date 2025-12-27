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

const EPHEMERAL_FLAG = 1 << 6;

async function originalHandle(interaction, env, ctx) {
  const options = interaction.data.options || [];
  const bet = options.find(o => o.name === 'bet')?.value;
  const amount = options.find(o => o.name === 'amount')?.value || 10;
  
  if (!bet) {
    return {
      type: 4,
      data: {
        content: '❌ Please choose heads or tails!',
        flags: EPHEMERAL_FLAG
      }
    };
  }
  
  const userName = interaction.member?.nick
    || interaction.member?.user?.global_name
    || interaction.member?.user?.username
    || interaction.user?.username
    || 'Player';
  
  // Flip the coin (0 = Heads, 1 = Tails)
  const flip = Math.random() < 0.5 ? 'heads' : 'tails';
  const flipDisplay = flip === 'heads' ? 'Heads' : 'Tails';
  const betDisplay = bet === 'heads' ? 'Heads' : 'Tails';
  
  // Determine winner
  const won = bet === flip;
  const profit = won ? amount : -amount;
  
  // Build embed
  const embed = {
    title: '🪙 Coin Flip',
    description: won 
      ? `**${userName}** wins! 🎉` 
      : `**${userName}** loses...`,
    color: won ? 0x57F287 : 0xED4245,
    fields: [
      {
        name: '🪙 Result',
        value: flipDisplay,
        inline: true
      },
      {
        name: '💰 Your Bet',
        value: `${betDisplay}: ${amount} coins`,
        inline: true
      },
      {
        name: won ? '🎉 Winnings' : '📉 Lost',
        value: won 
          ? `+${profit} coins (1:1)`
          : `${profit} coins`,
        inline: true
      }
    ],
    footer: {
      text: 'Coin Flip: Simple 50/50 betting | 1:1 payout'
    },
    timestamp: new Date().toISOString()
  };
  
  return {
    type: 4,
    data: {
      embeds: [embed]
    }
  };
}

export default async function handler(interaction, context) {
  const { env, ctx, moduleSettings } = context;
  
  // Call original handler with adapted parameters
  return originalHandle(interaction, env, ctx);
}
