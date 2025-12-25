export const definition = {
  name: 'coinflip',
  description: 'Flip a coin (heads or tails).'
};

export async function handle(interaction, env, ctx) {
  // Generate a random number (0 or 1) to simulate coin flip
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
  
  return {
    type: 4,
    data: {
      content: `🪙 **Coin Flip Result:** ${result}!`
    }
  };
}
