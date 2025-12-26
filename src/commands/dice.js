const EPHEMERAL_FLAG = 1 << 6;

// Dice emojis for visual representation
const DICE_EMOJIS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const definition = {
  name: 'dice',
  description: 'Play dice games with various betting options',
  options: [
    {
      type: 3,
      name: 'bet',
      description: 'Your bet type (e.g., "7", "11", "craps", "over7", "under7", "even", "odd")',
      required: true
    },
    {
      type: 4,
      name: 'amount',
      description: 'Amount to bet (for display purposes)',
      required: false
    }
  ]
};

function rollDice(count = 2) {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }
  return rolls;
}

function formatDice(rolls) {
  return rolls.map(r => DICE_EMOJIS[r - 1]).join(' ');
}

function checkWin(bet, rolls) {
  const total = rolls.reduce((sum, r) => sum + r, 0);
  const betLower = bet.toLowerCase().trim();
  
  // Specific number bets
  if (!isNaN(betLower)) {
    const betNum = parseInt(betLower);
    if (betNum === total) {
      // Higher payout for harder numbers
      let payout = 1;
      if (betNum === 2 || betNum === 12) payout = 30;
      else if (betNum === 3 || betNum === 11) payout = 15;
      else if (betNum === 4 || betNum === 10) payout = 7;
      else if (betNum === 5 || betNum === 9) payout = 4;
      else if (betNum === 6 || betNum === 8) payout = 5;
      else if (betNum === 7) payout = 4;
      
      return { win: true, payout, type: `Number ${betNum}` };
    }
    return { win: false, payout: 0, type: `Number ${betNum}` };
  }
  
  // Named bets
  switch (betLower) {
    case 'seven':
    case '7':
      if (total === 7) {
        return { win: true, payout: 4, type: 'Seven' };
      }
      return { win: false, payout: 0, type: 'Seven' };
    
    case 'eleven':
    case '11':
      if (total === 11) {
        return { win: true, payout: 15, type: 'Eleven' };
      }
      return { win: false, payout: 0, type: 'Eleven' };
    
    case 'craps':
      if (total === 2 || total === 3 || total === 12) {
        return { win: true, payout: 7, type: 'Craps (2, 3, 12)' };
      }
      return { win: false, payout: 0, type: 'Craps (2, 3, 12)' };
    
    case 'natural':
    case 'naturals':
      if (total === 7 || total === 11) {
        return { win: true, payout: 7, type: 'Natural (7 or 11)' };
      }
      return { win: false, payout: 0, type: 'Natural (7 or 11)' };
    
    case 'over7':
    case 'over':
    case 'high':
      if (total > 7) {
        return { win: true, payout: 1, type: 'Over 7' };
      }
      return { win: false, payout: 0, type: 'Over 7' };
    
    case 'under7':
    case 'under':
    case 'low':
      if (total < 7) {
        return { win: true, payout: 1, type: 'Under 7' };
      }
      return { win: false, payout: 0, type: 'Under 7' };
    
    case 'even':
      if (total % 2 === 0) {
        return { win: true, payout: 1, type: 'Even' };
      }
      return { win: false, payout: 0, type: 'Even' };
    
    case 'odd':
      if (total % 2 === 1) {
        return { win: true, payout: 1, type: 'Odd' };
      }
      return { win: false, payout: 0, type: 'Odd' };
    
    case 'doubles':
    case 'double':
      if (rolls.length === 2 && rolls[0] === rolls[1]) {
        return { win: true, payout: 10, type: 'Doubles' };
      }
      return { win: false, payout: 0, type: 'Doubles' };
    
    case 'boxcars':
      if (total === 12) {
        return { win: true, payout: 30, type: 'Boxcars (12)' };
      }
      return { win: false, payout: 0, type: 'Boxcars (12)' };
    
    case 'snakeeyes':
    case 'snake':
      if (total === 2) {
        return { win: true, payout: 30, type: 'Snake Eyes (2)' };
      }
      return { win: false, payout: 0, type: 'Snake Eyes (2)' };
    
    default:
      return { win: false, payout: 0, type: 'Unknown Bet' };
  }
}

export async function handle(interaction) {
  const options = interaction.data.options || [];
  const bet = options.find(o => o.name === 'bet')?.value;
  const amount = options.find(o => o.name === 'amount')?.value || 10;
  
  if (!bet) {
    return {
      type: 4,
      data: {
        content: '❌ Please specify a bet!',
        flags: EPHEMERAL_FLAG
      }
    };
  }
  
  const userName = interaction.member?.nick
    || interaction.member?.user?.global_name
    || interaction.member?.user?.username
    || interaction.user?.username
    || 'Player';
  
  // Roll the dice
  const rolls = rollDice(2);
  const total = rolls.reduce((sum, r) => sum + r, 0);
  const result = checkWin(bet, rolls);
  
  const diceDisplay = formatDice(rolls);
  const winnings = result.win ? amount * result.payout : -amount;
  const resultEmoji = result.win ? '🎉' : '😔';
  
  // Build embed
  const embed = {
    title: `🎲 Dice Game ${resultEmoji}`,
    description: result.win 
      ? `**${userName}** wins!` 
      : `**${userName}** loses...`,
    color: result.win ? 0x57F287 : 0xED4245,
    fields: [
      {
        name: '🎲 Roll Result',
        value: `${diceDisplay}\n**Total: ${total}**`,
        inline: true
      },
      {
        name: '💰 Your Bet',
        value: `${result.type}\n${amount} coins`,
        inline: true
      },
      {
        name: result.win ? '🎉 Winnings' : '📉 Lost',
        value: result.win 
          ? `+${winnings} coins (${result.payout}:1)`
          : `${winnings} coins`,
        inline: true
      }
    ],
    footer: {
      text: 'Bet types: 2-12, craps, natural, over7, under7, even, odd, doubles, snakeeyes, boxcars'
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
