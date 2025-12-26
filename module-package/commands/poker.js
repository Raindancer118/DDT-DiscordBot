/**
 * Handler for the /poker command
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

// Card suits and values
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };


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

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

function formatHand(hand) {
  return hand.map(formatCard).join(' ');
}

function evaluateHand(hand) {
  // Sort by rank value
  const sorted = [...hand].sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
  
  // Count ranks and suits
  const rankCounts = {};
  const suitCounts = {};
  
  for (const card of sorted) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isFlush = Object.values(suitCounts).some(count => count === 5);
  
  // Check for straight
  let isStraight = false;
  const values = sorted.map(c => RANK_VALUES[c.rank]);
  if (values[4] - values[0] === 4 && new Set(values).size === 5) {
    isStraight = true;
  }
  // Special case: A-2-3-4-5 (wheel)
  if (sorted[4].rank === 'A' && sorted[0].rank === '2' && sorted[1].rank === '3' && sorted[2].rank === '4' && sorted[3].rank === '5') {
    isStraight = true;
  }
  
  // Determine hand rank
  if (isStraight && isFlush) {
    if (sorted[4].rank === 'A' && sorted[0].rank === '10') {
      return { rank: 10, name: 'Royal Flush', payout: 250 };
    }
    return { rank: 9, name: 'Straight Flush', payout: 50 };
  }
  if (counts[0] === 4) {
    return { rank: 8, name: 'Four of a Kind', payout: 25 };
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return { rank: 7, name: 'Full House', payout: 9 };
  }
  if (isFlush) {
    return { rank: 6, name: 'Flush', payout: 6 };
  }
  if (isStraight) {
    return { rank: 5, name: 'Straight', payout: 4 };
  }
  if (counts[0] === 3) {
    return { rank: 4, name: 'Three of a Kind', payout: 3 };
  }
  if (counts[0] === 2 && counts[1] === 2) {
    return { rank: 3, name: 'Two Pair', payout: 2 };
  }
  if (counts[0] === 2) {
    return { rank: 2, name: 'Pair', payout: 1 };
  }
  
  return { rank: 1, name: 'High Card', payout: 0 };
}

async function originalHandle(interaction, env, ctx) {
  const options = interaction.data.options || [];
  const betAmount = options.find(o => o.name === 'bet')?.value || 10;
  
  const userName = interaction.member?.nick
    || interaction.member?.user?.global_name
    || interaction.member?.user?.username
    || interaction.user?.username
    || 'Player';
  
  // Create and shuffle deck
  let deck = createDeck();
  deck = shuffleDeck(deck);
  
  // Deal hands
  const playerHand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  
  // Evaluate hands
  const playerResult = evaluateHand(playerHand);
  const dealerResult = evaluateHand(dealerHand);
  
  // Determine winner
  let outcome;
  let winnings = 0;
  
  if (playerResult.rank > dealerResult.rank) {
    outcome = 'win';
    winnings = betAmount * (1 + playerResult.payout);
  } else if (playerResult.rank < dealerResult.rank) {
    outcome = 'lose';
    winnings = -betAmount;
  } else {
    outcome = 'push';
    winnings = 0;
  }
  
  const resultMessage = outcome === 'win' ? `${userName} wins!` : 
                       (outcome === 'lose' ? 'Dealer wins.' : 'Push (tie).');
  
  // Build embed
  const embed = {
    title: '🎴 Poker (5-Card Draw)',
    description: resultMessage,
    color: outcome === 'win' ? 0x57F287 : (outcome === 'push' ? 0xFEE75C : 0xED4245),
    fields: [
      {
        name: `${userName}'s Hand`,
        value: `${formatHand(playerHand)}\n**${playerResult.name}**`,
        inline: false
      },
      {
        name: `Dealer's Hand`,
        value: `${formatHand(dealerHand)}\n**${dealerResult.name}**`,
        inline: false
      },
      {
        name: '💰 Bet Amount',
        value: `${betAmount} coins`,
        inline: true
      },
      {
        name: outcome === 'win' ? '🎉 Winnings' : (outcome === 'push' ? '🤝 Push' : '📉 Lost'),
        value: outcome === 'win' ? `+${winnings} coins` : 
               (outcome === 'push' ? `${betAmount} coins (returned)` : `${winnings} coins`),
        inline: true
      }
    ],
    footer: {
      text: 'Hand Rankings: Royal Flush > Straight Flush > Four of a Kind > Full House > Flush > Straight > Three of a Kind > Two Pair > Pair > High Card'
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
