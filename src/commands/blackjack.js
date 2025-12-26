const EPHEMERAL_FLAG = 1 << 6;

// Card suits and values
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const definition = {
  name: 'blackjack',
  description: 'Play a game of Blackjack (21)',
  options: [
    {
      type: 4,
      name: 'bet',
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
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    const cardValue = getCardValue(card);
    value += cardValue;
    if (card.rank === 'A') aces++;
  }
  
  // Adjust for aces if needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

function formatHand(hand) {
  return hand.map(formatCard).join(' ');
}

function dealerShouldHit(hand) {
  const value = calculateHandValue(hand);
  return value < 17;
}

function determineWinner(playerValue, dealerValue, playerBlackjack, dealerBlackjack) {
  if (playerValue > 21) {
    return { result: 'lose', message: 'Player busts! Dealer wins.' };
  }
  if (dealerValue > 21) {
    return { result: 'win', message: 'Dealer busts! Player wins!' };
  }
  if (playerBlackjack && !dealerBlackjack) {
    return { result: 'blackjack', message: '🎉 BLACKJACK! Player wins!' };
  }
  if (dealerBlackjack && !playerBlackjack) {
    return { result: 'lose', message: 'Dealer has Blackjack. Player loses.' };
  }
  if (playerBlackjack && dealerBlackjack) {
    return { result: 'push', message: 'Both have Blackjack. Push (tie).' };
  }
  if (playerValue > dealerValue) {
    return { result: 'win', message: 'Player wins!' };
  }
  if (dealerValue > playerValue) {
    return { result: 'lose', message: 'Dealer wins.' };
  }
  return { result: 'push', message: 'Push (tie).' };
}

export async function handle(interaction, env, ctx) {
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
  
  // Deal initial cards
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];
  
  // Calculate initial values
  let playerValue = calculateHandValue(playerHand);
  let dealerValue = calculateHandValue(dealerHand);
  
  const playerBlackjack = playerHand.length === 2 && playerValue === 21;
  const dealerBlackjack = dealerHand.length === 2 && dealerValue === 21;
  
  // If player doesn't have blackjack, simulate player standing at current value
  // (simplified version - in real blackjack, player would choose to hit/stand)
  // For this simple implementation, player auto-hits until 17 or higher
  if (!playerBlackjack) {
    while (playerValue < 17 && playerValue <= 21) {
      playerHand.push(deck.pop());
      playerValue = calculateHandValue(playerHand);
    }
  }
  
  // Dealer plays
  while (dealerShouldHit(dealerHand) && dealerValue <= 21) {
    dealerHand.push(deck.pop());
    dealerValue = calculateHandValue(dealerHand);
  }
  
  // Determine winner
  const outcome = determineWinner(playerValue, dealerValue, playerBlackjack, dealerBlackjack);
  
  // Calculate winnings
  let winnings = 0;
  if (outcome.result === 'blackjack') {
    winnings = Math.floor(betAmount * 2.5); // Blackjack pays 3:2
  } else if (outcome.result === 'win') {
    winnings = betAmount * 2;
  } else if (outcome.result === 'push') {
    winnings = betAmount; // Get bet back
  }
  
  const profit = winnings - betAmount;
  
  // Build embed
  const embed = {
    title: '🃏 Blackjack',
    description: outcome.message,
    color: outcome.result === 'blackjack' ? 0xFFD700 : 
           (outcome.result === 'win' ? 0x57F287 : 
           (outcome.result === 'push' ? 0xFEE75C : 0xED4245)),
    fields: [
      {
        name: `${userName}'s Hand (${playerValue})`,
        value: formatHand(playerHand) + (playerValue > 21 ? ' 💥 BUST' : ''),
        inline: false
      },
      {
        name: `Dealer's Hand (${dealerValue})`,
        value: formatHand(dealerHand) + (dealerValue > 21 ? ' 💥 BUST' : ''),
        inline: false
      },
      {
        name: '💰 Bet Amount',
        value: `${betAmount} coins`,
        inline: true
      },
      {
        name: profit > 0 ? '🎉 Profit' : (profit === 0 ? '🤝 Push' : '📉 Lost'),
        value: profit > 0 ? `+${profit} coins` : 
               (profit === 0 ? `${betAmount} coins (returned)` : `${profit} coins`),
        inline: true
      }
    ],
    footer: {
      text: 'Simplified Blackjack: Auto-play to 17+ | Blackjack pays 3:2'
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
