const EPHEMERAL_FLAG = 1 << 6;

// Roulette wheel numbers with their colors (0 and 00 are green)
const ROULETTE_NUMBERS = {
  0: 'green',
  1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black',
  7: 'red', 8: 'black', 9: 'red', 10: 'black', 11: 'black', 12: 'red',
  13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
  19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black',
  25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
  31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red',
  37: 'green' // 00 represented as 37
};

const COLOR_EMOJIS = {
  red: '🔴',
  black: '⚫',
  green: '🟢'
};

export const definition = {
  name: 'roulette',
  description: 'Play roulette with various betting options',
  options: [
    {
      type: 3,
      name: 'bet',
      description: 'Your bet (e.g., "17", "red", "odd", "1-18", "dozen1", "column1")',
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

function spinWheel() {
  // European roulette: 0-36 (37 numbers)
  // For American roulette with 00, we use 0-37 where 37 represents 00
  const result = Math.floor(Math.random() * 38); // 0-37 (including 00 as 37)
  return result;
}

function getColor(number) {
  return ROULETTE_NUMBERS[number] || 'green';
}

function checkWin(bet, number) {
  const color = getColor(number);
  const betLower = bet.toLowerCase().trim();
  
  // Straight up number bet
  if (!isNaN(betLower)) {
    const betNum = parseInt(betLower);
    if (betNum === number) {
      return { win: true, payout: 35, type: 'Straight Up' };
    }
    return { win: false, payout: 0, type: 'Straight Up' };
  }
  
  // 00 bet
  if (betLower === '00' && number === 37) {
    return { win: true, payout: 35, type: 'Straight Up (00)' };
  }
  
  // Color bets
  if (betLower === 'red' && color === 'red') {
    return { win: true, payout: 1, type: 'Red' };
  }
  if (betLower === 'black' && color === 'black') {
    return { win: true, payout: 1, type: 'Black' };
  }
  if ((betLower === 'green' || betLower === 'zero') && color === 'green') {
    return { win: true, payout: 35, type: 'Green' };
  }
  
  // Even/Odd (0 and 00 don't count)
  if (betLower === 'even' && number !== 0 && number !== 37 && number % 2 === 0) {
    return { win: true, payout: 1, type: 'Even' };
  }
  if (betLower === 'odd' && number !== 0 && number !== 37 && number % 2 === 1) {
    return { win: true, payout: 1, type: 'Odd' };
  }
  
  // Low/High
  if (betLower === '1-18' || betLower === 'low') {
    if (number >= 1 && number <= 18) {
      return { win: true, payout: 1, type: '1-18 (Low)' };
    }
    return { win: false, payout: 0, type: '1-18 (Low)' };
  }
  if (betLower === '19-36' || betLower === 'high') {
    if (number >= 19 && number <= 36) {
      return { win: true, payout: 1, type: '19-36 (High)' };
    }
    return { win: false, payout: 0, type: '19-36 (High)' };
  }
  
  // Dozens
  if (betLower === 'dozen1' || betLower === '1st12') {
    if (number >= 1 && number <= 12) {
      return { win: true, payout: 2, type: '1st Dozen (1-12)' };
    }
    return { win: false, payout: 0, type: '1st Dozen (1-12)' };
  }
  if (betLower === 'dozen2' || betLower === '2nd12') {
    if (number >= 13 && number <= 24) {
      return { win: true, payout: 2, type: '2nd Dozen (13-24)' };
    }
    return { win: false, payout: 0, type: '2nd Dozen (13-24)' };
  }
  if (betLower === 'dozen3' || betLower === '3rd12') {
    if (number >= 25 && number <= 36) {
      return { win: true, payout: 2, type: '3rd Dozen (25-36)' };
    }
    return { win: false, payout: 0, type: '3rd Dozen (25-36)' };
  }
  
  // Columns
  if (betLower === 'column1' || betLower === 'col1') {
    if (number !== 0 && number !== 37 && (number - 1) % 3 === 0) {
      return { win: true, payout: 2, type: '1st Column' };
    }
    return { win: false, payout: 0, type: '1st Column' };
  }
  if (betLower === 'column2' || betLower === 'col2') {
    if (number !== 0 && number !== 37 && (number - 2) % 3 === 0) {
      return { win: true, payout: 2, type: '2nd Column' };
    }
    return { win: false, payout: 0, type: '2nd Column' };
  }
  if (betLower === 'column3' || betLower === 'col3') {
    if (number !== 0 && number !== 37 && number % 3 === 0) {
      return { win: true, payout: 2, type: '3rd Column' };
    }
    return { win: false, payout: 0, type: '3rd Column' };
  }
  
  return { win: false, payout: 0, type: 'Unknown' };
}

function formatNumber(number) {
  if (number === 37) return '00';
  return number.toString();
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
  
  // Spin the wheel
  const number = spinWheel();
  const color = getColor(number);
  const result = checkWin(bet, number);
  
  const numberDisplay = formatNumber(number);
  const colorEmoji = COLOR_EMOJIS[color] || '⚪';
  
  // Build embed
  const winnings = result.win ? amount * result.payout : -amount;
  const resultEmoji = result.win ? '🎉' : '😔';
  
  const embed = {
    title: `🎰 Roulette ${resultEmoji}`,
    description: result.win 
      ? `**${userName}** wins!` 
      : `**${userName}** loses...`,
    color: result.win ? 0x57F287 : 0xED4245,
    fields: [
      {
        name: '🎲 Result',
        value: `${colorEmoji} **${numberDisplay}** (${color})`,
        inline: true
      },
      {
        name: '💰 Your Bet',
        value: `${result.type}: ${amount} coins`,
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
      text: 'Bet types: number (0-36, 00), red, black, odd, even, 1-18, 19-36, dozen1-3, column1-3'
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
