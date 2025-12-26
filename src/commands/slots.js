const EPHEMERAL_FLAG = 1 << 6;

// Slot symbols with their emojis and weights
const SLOT_SYMBOLS = [
  { emoji: '🍒', name: 'Cherry', weight: 30 },
  { emoji: '🍋', name: 'Lemon', weight: 25 },
  { emoji: '🍊', name: 'Orange', weight: 20 },
  { emoji: '🍉', name: 'Watermelon', weight: 15 },
  { emoji: '⭐', name: 'Star', weight: 7 },
  { emoji: '💎', name: 'Diamond', weight: 2 },
  { emoji: '7️⃣', name: 'Seven', weight: 1 }
];

const PAYOUTS = {
  '🍒🍒🍒': { payout: 5, name: 'Three Cherries' },
  '🍋🍋🍋': { payout: 10, name: 'Three Lemons' },
  '🍊🍊🍊': { payout: 15, name: 'Three Oranges' },
  '🍉🍉🍉': { payout: 20, name: 'Three Watermelons' },
  '⭐⭐⭐': { payout: 50, name: 'Three Stars' },
  '💎💎💎': { payout: 100, name: 'Three Diamonds' },
  '7️⃣7️⃣7️⃣': { payout: 777, name: 'JACKPOT - Three Sevens' },
  // Two of a kind
  '🍒🍒': { payout: 2, name: 'Two Cherries' },
  '🍋🍋': { payout: 3, name: 'Two Lemons' },
  '🍊🍊': { payout: 4, name: 'Two Oranges' },
  '🍉🍉': { payout: 5, name: 'Two Watermelons' },
  '⭐⭐': { payout: 10, name: 'Two Stars' },
  '💎💎': { payout: 25, name: 'Two Diamonds' },
  '7️⃣7️⃣': { payout: 50, name: 'Two Sevens' }
};

export const definition = {
  name: 'slots',
  description: 'Play the slot machine',
  options: [
    {
      type: 4,
      name: 'bet',
      description: 'Amount to bet (for display purposes)',
      required: false
    }
  ]
};

function getWeightedRandomSymbol() {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const symbol of SLOT_SYMBOLS) {
    random -= symbol.weight;
    if (random <= 0) {
      return symbol.emoji;
    }
  }
  
  return SLOT_SYMBOLS[0].emoji;
}

function calculatePayout(reels, betAmount) {
  const [reel1, reel2, reel3] = reels;
  
  // Check for three of a kind
  const threeMatch = `${reel1}${reel2}${reel3}`;
  if (PAYOUTS[threeMatch]) {
    return {
      win: true,
      payout: PAYOUTS[threeMatch].payout,
      winType: PAYOUTS[threeMatch].name,
      winnings: betAmount * PAYOUTS[threeMatch].payout
    };
  }
  
  // Check for two of a kind (first two)
  if (reel1 === reel2) {
    const twoMatch = `${reel1}${reel2}`;
    if (PAYOUTS[twoMatch]) {
      return {
        win: true,
        payout: PAYOUTS[twoMatch].payout,
        winType: PAYOUTS[twoMatch].name,
        winnings: betAmount * PAYOUTS[twoMatch].payout
      };
    }
  }
  
  // Check for two of a kind (last two)
  if (reel2 === reel3) {
    const twoMatch = `${reel2}${reel3}`;
    if (PAYOUTS[twoMatch]) {
      return {
        win: true,
        payout: PAYOUTS[twoMatch].payout,
        winType: PAYOUTS[twoMatch].name,
        winnings: betAmount * PAYOUTS[twoMatch].payout
      };
    }
  }
  
  return {
    win: false,
    payout: 0,
    winType: 'No Match',
    winnings: -betAmount
  };
}

export async function handle(interaction, env, ctx) {
  const options = interaction.data.options || [];
  const betAmount = options.find(o => o.name === 'bet')?.value || 10;
  
  const userName = interaction.member?.nick
    || interaction.member?.user?.global_name
    || interaction.member?.user?.username
    || interaction.user?.username
    || 'Player';
  
  // Spin the reels
  const reels = [
    getWeightedRandomSymbol(),
    getWeightedRandomSymbol(),
    getWeightedRandomSymbol()
  ];
  
  const result = calculatePayout(reels, betAmount);
  
  // Build the slot machine display
  const slotDisplay = `
┏━━━━━━━━━━━━━┓
┃  ${reels[0]}  ${reels[1]}  ${reels[2]}  ┃
┗━━━━━━━━━━━━━┛
`;
  
  const isJackpot = result.winType.includes('JACKPOT');
  const resultEmoji = isJackpot ? '🎰💰🎊' : (result.win ? '🎉' : '😔');
  
  const embed = {
    title: `🎰 Slot Machine ${resultEmoji}`,
    description: `${slotDisplay}`,
    color: isJackpot ? 0xFFD700 : (result.win ? 0x57F287 : 0xED4245),
    fields: [
      {
        name: '🎲 Result',
        value: result.winType,
        inline: true
      },
      {
        name: '💰 Bet Amount',
        value: `${betAmount} coins`,
        inline: true
      },
      {
        name: result.win ? '🎉 Winnings' : '📉 Lost',
        value: result.win 
          ? `+${result.winnings} coins (${result.payout}x)`
          : `${result.winnings} coins`,
        inline: true
      }
    ],
    footer: {
      text: userName,
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
