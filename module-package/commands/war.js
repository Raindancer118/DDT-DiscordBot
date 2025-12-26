/**
 * Handler for the /war command
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

function getCardValue(card) {
  return RANK_VALUES[card.rank];
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
  
  // Draw cards
  const playerCard = deck.pop();
  const dealerCard = deck.pop();
  
  const playerValue = getCardValue(playerCard);
  const dealerValue = getCardValue(dealerCard);
  
  let outcome;
  let winnings = 0;
  let warHappened = false;
  let warCards = [];
  
  if (playerValue > dealerValue) {
    outcome = 'win';
    winnings = betAmount * 2;
  } else if (playerValue < dealerValue) {
    outcome = 'lose';
    winnings = -betAmount;
  } else {
    // WAR!
    warHappened = true;
    
    // In war, each player places 3 cards face down and 1 face up
    // Simplified version: just draw one more card for each
    if (deck.length >= 2) {
      const playerWarCard = deck.pop();
      const dealerWarCard = deck.pop();
      warCards = [playerWarCard, dealerWarCard];
      
      const playerWarValue = getCardValue(playerWarCard);
      const dealerWarValue = getCardValue(dealerWarCard);
      
      if (playerWarValue > dealerWarValue) {
        outcome = 'win_war';
        winnings = betAmount + (betAmount * 2); // Original bet + 2:1 winnings
      } else if (playerWarValue < dealerWarValue) {
        outcome = 'lose_war';
        winnings = -betAmount;
      } else {
        // Another tie - player wins in simplified version
        outcome = 'tie_war';
        winnings = betAmount; // Return bet
      }
    } else {
      outcome = 'tie';
      winnings = betAmount; // Return bet
    }
  }
  
  const profit = winnings - betAmount;
  
  let resultMessage;
  if (outcome === 'win') {
    resultMessage = `${userName} wins!`;
  } else if (outcome === 'lose') {
    resultMessage = 'Dealer wins.';
  } else if (outcome === 'win_war') {
    resultMessage = `⚔️ WAR! ${userName} wins the war!`;
  } else if (outcome === 'lose_war') {
    resultMessage = `⚔️ WAR! Dealer wins the war.`;
  } else {
    resultMessage = `⚔️ WAR resulted in another tie!`;
  }
  
  // Build embed
  const fields = [
    {
      name: `${userName}'s Card`,
      value: `${formatCard(playerCard)} (${playerValue})`,
      inline: true
    },
    {
      name: `Dealer's Card`,
      value: `${formatCard(dealerCard)} (${dealerValue})`,
      inline: true
    }
  ];
  
  if (warHappened && warCards.length > 0) {
    fields.push({
      name: '⚔️ War Cards',
      value: `${userName}: ${formatCard(warCards[0])} (${getCardValue(warCards[0])})\nDealer: ${formatCard(warCards[1])} (${getCardValue(warCards[1])})`,
      inline: false
    });
  }
  
  fields.push(
    {
      name: '💰 Bet Amount',
      value: `${betAmount} coins`,
      inline: true
    },
    {
      name: outcome.includes('win') ? '🎉 Winnings' : (outcome.includes('tie') ? '🤝 Returned' : '📉 Lost'),
      value: outcome.includes('win') ? `+${profit} coins` : 
             (outcome.includes('tie') ? `${betAmount} coins` : `${profit} coins`),
      inline: true
    }
  );
  
  const embed = {
    title: '⚔️ War',
    description: resultMessage,
    color: outcome.includes('win') ? 0x57F287 : (outcome.includes('tie') ? 0xFEE75C : 0xED4245),
    fields,
    footer: {
      text: 'War: Tie cards trigger war! Win war for 2:1 payout'
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
