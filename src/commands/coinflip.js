const EPHEMERAL_FLAG = 1 << 6;

export const definition = {
  name: 'coinflip',
  description: 'Flip a coin and bet on heads or tails',
  options: [
    {
      type: 3,
      name: 'bet',
      description: 'Bet on heads or tails',
      required: true,
      choices: [
        { name: 'Heads', value: 'heads' },
        { name: 'Tails', value: 'tails' }
      ]
    },
    {
      type: 4,
      name: 'amount',
      description: 'Amount to bet (for display purposes)',
      required: false
    }
  ]
};

export async function handle(interaction, env, ctx) {
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
