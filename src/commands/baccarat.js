const EPHEMERAL_FLAG = 1 << 6;

// Card suits and values
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const definition = {
  name: 'baccarat',
  description: 'Play Baccarat - bet on Player, Banker, or Tie',
  options: [
    {
      type: 3,
      name: 'bet',
      description: 'Bet on: player, banker, or tie',
      required: true,
      choices: [
        { name: 'Player', value: 'player' },
        { name: 'Banker', value: 'banker' },
        { name: 'Tie', value: 'tie' }
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

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getCardValue(card) {
  if (['J', 'Q', 'K', '10'].includes(card.rank)) return 0;
  if (card.rank === 'A') return 1;
  return parseInt(card.rank);
}

function calculateHandValue(hand) {
  const sum = hand.reduce((total, card) => total + getCardValue(card), 0);
  return sum % 10; // Only last digit counts in Baccarat
}

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

function formatHand(hand) {
  return hand.map(formatCard).join(' ');
}

function shouldDrawThirdCard(playerValue, bankerValue, playerThirdCard = null) {
  // Player draws on 0-5, stands on 6-7
  const playerDraws = playerValue <= 5;
  
  // Banker drawing rules (more complex)
  let bankerDraws = false;
  if (bankerValue <= 2) {
    bankerDraws = true;
  } else if (bankerValue === 3) {
    bankerDraws = !playerThirdCard || getCardValue(playerThirdCard) !== 8;
  } else if (bankerValue === 4) {
    bankerDraws = playerThirdCard && [2, 3, 4, 5, 6, 7].includes(getCardValue(playerThirdCard));
  } else if (bankerValue === 5) {
    bankerDraws = playerThirdCard && [4, 5, 6, 7].includes(getCardValue(playerThirdCard));
  } else if (bankerValue === 6) {
    bankerDraws = playerThirdCard && [6, 7].includes(getCardValue(playerThirdCard));
  }
  
  return { playerDraws, bankerDraws };
}

export async function handle(interaction, env, ctx) {
  const options = interaction.data.options || [];
  const bet = options.find(o => o.name === 'bet')?.value;
  const amount = options.find(o => o.name === 'amount')?.value || 10;
  
  if (!bet) {
    return {
      type: 4,
      data: {
        content: '❌ Please specify a bet (player, banker, or tie)!',
        flags: EPHEMERAL_FLAG
      }
    };
  }
  
  const userName = interaction.member?.nick
    || interaction.member?.user?.global_name
    || interaction.member?.user?.username
    || interaction.user?.username
    || 'Player';
  
  // Create and shuffle deck
  let deck = createDeck();
  deck = shuffleDeck(deck);
  
  // Deal initial two cards to each
  const playerHand = [deck.pop(), deck.pop()];
  const bankerHand = [deck.pop(), deck.pop()];
  
  let playerValue = calculateHandValue(playerHand);
  let bankerValue = calculateHandValue(bankerHand);
  
  // Check for natural (8 or 9)
  const playerNatural = playerValue >= 8;
  const bankerNatural = bankerValue >= 8;
  
  let playerThirdCard = null;
  
  // Draw third cards if no natural
  if (!playerNatural && !bankerNatural) {
    const { playerDraws, bankerDraws } = shouldDrawThirdCard(playerValue, bankerValue);
    
    if (playerDraws) {
      playerThirdCard = deck.pop();
      playerHand.push(playerThirdCard);
      playerValue = calculateHandValue(playerHand);
    }
    
    const { bankerDraws: bankerDrawsFinal } = shouldDrawThirdCard(playerValue, bankerValue, playerThirdCard);
    if (bankerDrawsFinal) {
      bankerHand.push(deck.pop());
      bankerValue = calculateHandValue(bankerHand);
    }
  }
  
  // Determine winner
  let outcome;
  let winnings = 0;
  
  if (playerValue > bankerValue) {
    outcome = 'player';
    if (bet === 'player') {
      winnings = amount * 2; // 1:1 payout
    } else {
      winnings = -amount;
    }
  } else if (bankerValue > playerValue) {
    outcome = 'banker';
    if (bet === 'banker') {
      winnings = amount + Math.floor(amount * 0.95); // Original bet + 0.95:1 winnings (5% commission)
    } else {
      winnings = -amount;
    }
  } else {
    outcome = 'tie';
    if (bet === 'tie') {
      winnings = amount * 9; // 8:1 payout
    } else {
      winnings = 0; // Push on tie if bet on player/banker
    }
  }
  
  const profit = winnings - amount;
  const won = bet === outcome;
  const push = outcome === 'tie' && bet !== 'tie';
  
  const resultMessage = outcome === 'player' ? 'Player wins!' : 
                       (outcome === 'banker' ? 'Banker wins!' : 'Tie!');
  
  // Build embed
  const embed = {
    title: '🎴 Baccarat',
    description: resultMessage + (won ? ` You win! 🎉` : (push ? ` (Push)` : '')),
    color: won ? 0x57F287 : (push ? 0xFEE75C : 0xED4245),
    fields: [
      {
        name: `Player Hand (${playerValue})`,
        value: formatHand(playerHand) + (playerNatural ? ' 🌟 Natural' : ''),
        inline: false
      },
      {
        name: `Banker Hand (${bankerValue})`,
        value: formatHand(bankerHand) + (bankerNatural ? ' 🌟 Natural' : ''),
        inline: false
      },
      {
        name: '💰 Your Bet',
        value: `${bet.charAt(0).toUpperCase() + bet.slice(1)}: ${amount} coins`,
        inline: true
      },
      {
        name: won ? '🎉 Winnings' : (push ? '🤝 Push' : '📉 Lost'),
        value: won ? `+${profit} coins` : 
               (push ? `${amount} coins (returned)` : `${profit} coins`),
        inline: true
      }
    ],
    footer: {
      text: 'Payouts: Player 1:1 | Banker 0.95:1 | Tie 8:1'
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
